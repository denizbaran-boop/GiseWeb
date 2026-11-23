using Gise.Web.Data;
using Gise.Web.Infrastructure;
using Gise.Web.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Hosting platforms such as Render tell the app which port to listen on.
if (Environment.GetEnvironmentVariable("PORT") is { Length: > 0 } port)
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ---- Data -------------------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("Gise") ?? "Data Source=gise.db";
var dataDir = Path.GetDirectoryName(Path.GetFullPath(new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(connectionString).DataSource))!;
Directory.CreateDirectory(dataDir);
builder.Services.AddDbContext<GiseDbContext>(o => o.UseSqlite(connectionString));

// Keep cookie/anti-forgery keys next to the database so sign-ins survive a restart.
builder.Services.AddDataProtection()
    .SetApplicationName("Gise.Web")
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataDir, "keys")));

// Behind a hosting proxy the original scheme (https) arrives in X-Forwarded-Proto.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

// ---- Domain services ---------------------------------------------------------
builder.Services.AddSingleton<IClock, IstanbulClock>();
builder.Services.AddSingleton<TicketTokenService>();
builder.Services.AddSingleton<QrService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<TicketingService>();
builder.Services.AddScoped<EventQueryService>();
builder.Services.AddScoped<EventManagementService>();
builder.Services.AddScoped<CopywriterService>();
builder.Services.AddHttpClient();
builder.Services.AddHostedService<HoldCleanupService>();

// ---- Auth (cookie sessions + role-based access, FR-01) ------------------------
builder.Services.AddScoped<GiseCookieEvents>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "gise.auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.LoginPath = "/giris";
        o.LogoutPath = "/cikis";
        o.AccessDeniedPath = "/erisim-yok";
        o.ExpireTimeSpan = TimeSpan.FromDays(14);
        o.SlidingExpiration = true;
        o.EventsType = typeof(GiseCookieEvents);
    });
builder.Services.AddAuthorization();

// ---- MVC ---------------------------------------------------------------------
// Keep Turkish characters readable in rendered HTML instead of &#x131; entities.
builder.Services.AddWebEncoders(o => o.TextEncoderSettings = new System.Text.Encodings.Web.TextEncoderSettings(System.Text.Unicode.UnicodeRanges.All));
builder.Services.AddAntiforgery(o => o.HeaderName = "X-CSRF-TOKEN");
builder.Services.AddControllersWithViews(o =>
{
    o.Filters.Add(new AutoValidateAntiforgeryTokenAttribute()); // forms and fetch() calls
    o.Filters.Add<DomainExceptionFilter>();
    // Turkish model-binding messages (shown when a value can't be parsed at all).
    var m = o.ModelBindingMessageProvider;
    m.SetValueMustBeANumberAccessor(_ => "Bu alana yalnızca rakam girebilirsin.");
    m.SetAttemptedValueIsInvalidAccessor((v, _) => $"'{v}' geçerli bir değer değil.");
    m.SetValueIsInvalidAccessor(v => $"'{v}' geçerli bir değer değil.");
    m.SetValueMustNotBeNullAccessor(_ => "Bu alan boş bırakılamaz.");
    m.SetMissingBindRequiredValueAccessor(_ => "Bu alan zorunlu.");
    m.SetMissingKeyOrValueAccessor(() => "Bu alan zorunlu.");
    m.SetNonPropertyAttemptedValueIsInvalidAccessor(v => $"'{v}' geçerli bir değer değil.");
    m.SetNonPropertyValueMustBeANumberAccessor(() => "Yalnızca rakam girebilirsin.");
    m.SetUnknownValueIsInvalidAccessor(_ => "Geçersiz değer.");
    m.SetMissingRequestBodyRequiredValueAccessor(() => "İstek gövdesi boş olamaz.");
});
// API validation errors: one Turkish title and no framework internals (e.g. JSON parser messages).
builder.Services.Configure<ApiBehaviorOptions>(o => o.InvalidModelStateResponseFactory = ctx =>
{
    var pd = new ValidationProblemDetails(ctx.ModelState) { Status = 400 };
    foreach (var key in pd.Errors.Keys.ToList())
        pd.Errors[key] = pd.Errors[key].Select(e => e.Contains("JSON", StringComparison.OrdinalIgnoreCase) || e.Contains("System.") ? "Geçersiz değer." : e).ToArray();
    pd.Title = pd.Errors.Values.SelectMany(v => v).FirstOrDefault() ?? "Gönderilen bilgileri kontrol et.";
    return new BadRequestObjectResult(pd) { ContentTypes = { "application/problem+json" } };
});
builder.Services.AddProblemDetails();

var app = builder.Build();

// ---- Database: apply migrations and seed demo data ---------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GiseDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db, scope.ServiceProvider.GetRequiredService<IClock>());
}

app.UseForwardedHeaders();

// ---- Error handling ----------------------------------------------------------
// Unhandled exceptions: JSON ProblemDetails for /api, friendly page for everything else.
app.UseExceptionHandler(errorApp => errorApp.Run(async http =>
{
    var feature = http.Features.Get<IExceptionHandlerPathFeature>();
    var log = http.RequestServices.GetRequiredService<ILogger<Program>>();
    log.LogError(feature?.Error, "Unhandled exception on {Path}", feature?.Path);

    http.Response.StatusCode = StatusCodes.Status500InternalServerError;
    if (feature?.Path.StartsWith("/api") == true)
    {
        await http.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = 500,
            Title = "Beklenmeyen bir hata oluştu. Lütfen tekrar dene.",
            Extensions = { ["traceId"] = http.TraceIdentifier }
        }, options: null, contentType: "application/problem+json");
        return;
    }
    http.Response.Redirect($"/durum/500?trace={Uri.EscapeDataString(http.TraceIdentifier)}");
}));
if (!app.Environment.IsDevelopment()) app.UseHsts();

// Empty 4xx/5xx responses: ProblemDetails for /api, a styled page for browsers.
app.UseWhen(c => c.Request.IsApi(), a => a.UseStatusCodePages());
app.UseWhen(c => !c.Request.IsApi(), a => a.UseStatusCodePagesWithReExecute("/durum/{0}"));

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
