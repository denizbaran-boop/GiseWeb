using System.Security.Claims;
using Gise.Web.Data;
using Gise.Web.Models;
using Gise.Web.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Gise.Web.Infrastructure;

public static class Roles
{
    public const string Attendee = nameof(UserRole.Attendee);
    public const string Organizer = nameof(UserRole.Organizer);
    public const string Admin = nameof(UserRole.Admin);
    public const string OrganizerOrAdmin = Organizer + "," + Admin;

    public static string Label(UserRole r) => r switch { UserRole.Organizer => "Organizatör", UserRole.Admin => "Admin", _ => "Katılımcı" };
}

public static class ClaimsExtensions
{
    public static int Id(this ClaimsPrincipal p) => int.TryParse(p.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    public static bool IsSignedIn(this ClaimsPrincipal p) => p.Identity?.IsAuthenticated == true;

    public static ClaimsPrincipal ToPrincipal(this User u) =>
        new(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
            new Claim(ClaimTypes.Name, u.FullName),
            new Claim("username", u.Username),
            new Claim(ClaimTypes.Role, u.Role.ToString()),
        }, CookieAuthenticationDefaults.AuthenticationScheme));
}

public static class HttpExtensions
{
    public static bool IsApi(this HttpRequest r) => r.Path.StartsWithSegments("/api");
}

/// <summary>Cookie auth tweaks: JSON 401/403 for the API and immediate logout of banned or deleted users.</summary>
public class GiseCookieEvents(GiseDbContext db, IClock clock) : CookieAuthenticationEvents
{
    public override async Task ValidatePrincipal(CookieValidatePrincipalContext ctx)
    {
        var id = ctx.Principal?.Id() ?? 0;
        var user = id == 0 ? null : await db.Users.FindAsync(id);
        if (user is null || user.IsBanned(clock.Now))
        {
            ctx.RejectPrincipal();
            await ctx.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return;
        }
        // Keep the display name / role in the cookie in sync with the database.
        if (ctx.Principal!.Identity!.Name != user.FullName || !ctx.Principal.IsInRole(user.Role.ToString()) || ctx.Principal.FindFirstValue("username") != user.Username)
        {
            ctx.ReplacePrincipal(user.ToPrincipal());
            ctx.ShouldRenew = true;
        }
    }

    public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> ctx) =>
        ctx.Request.IsApi() ? Problem(ctx.HttpContext, 401, "Bu işlem için giriş yapman gerekiyor.") : base.RedirectToLogin(ctx);

    public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> ctx) =>
        ctx.Request.IsApi() ? Problem(ctx.HttpContext, 403, "Bu işlem için yetkin yok.") : base.RedirectToAccessDenied(ctx);

    private static Task Problem(HttpContext http, int status, string title)
    {
        http.Response.StatusCode = status;
        return http.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title }, options: null, contentType: "application/problem+json");
    }
}

/// <summary>Turns <see cref="DomainException"/> into a ProblemDetails response (API) or a friendly status page (MVC).</summary>
public class DomainExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext ctx)
    {
        if (ctx.Exception is not DomainException ex) return;
        if (ctx.HttpContext.Request.IsApi())
        {
            var pd = new ValidationProblemDetails { Status = ex.StatusCode, Title = ex.Message };
            if (ex.Field is not null) pd.Errors[ex.Field] = new[] { ex.Message };
            ctx.Result = new ObjectResult(pd) { StatusCode = ex.StatusCode, ContentTypes = { "application/problem+json" } };
        }
        else
        {
            ctx.Result = new ViewResult
            {
                ViewName = "Status",
                StatusCode = ex.StatusCode,
                ViewData = new Microsoft.AspNetCore.Mvc.ViewFeatures.ViewDataDictionary(new Microsoft.AspNetCore.Mvc.ModelBinding.EmptyModelMetadataProvider(), ctx.ModelState)
                {
                    Model = new ViewModels.StatusVm(ex.StatusCode, ex.Message)
                }
            };
        }
        ctx.ExceptionHandled = true;
    }
}
