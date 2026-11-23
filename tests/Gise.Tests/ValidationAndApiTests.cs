using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Gise.Web.Models;
using Gise.Web.Services;
using Gise.Web.ViewModels;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Gise.Tests;

public class ValidationTests
{
    private static List<ValidationResult> Validate(object model, IClock? clock = null)
    {
        var services = new ServiceCollection();
        services.AddSingleton(clock ?? new FakeClock());
        var ctx = new ValidationContext(model, services.BuildServiceProvider(), null);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, ctx, results, validateAllProperties: true);
        return results;
    }

    [Theory]
    [InlineData("4242 4242 4242 4242", true)]
    [InlineData("4000000000000002", true)]
    [InlineData("4242 4242 4242 4241", false)]
    [InlineData("1234", false)]
    [InlineData("4242-4242-4242-4242", false)]
    public void Luhn_checks_card_numbers(string number, bool valid) => Assert.Equal(valid, new LuhnAttribute().IsValid(number));

    [Fact]
    public void Expired_card_is_rejected()
    {
        var r = Validate(new PayRequest { CardName = "Elif Kaya", CardNumber = "4242424242424242", Expiry = "10/26", Cvc = "123" });
        Assert.Contains(r, x => x.ErrorMessage!.Contains("geçmiş"));
    }

    [Fact]
    public void Organizer_registration_needs_organization_name()
    {
        var r = Validate(new RegisterVm { FullName = "Deniz Baran", Username = "deniz", Email = "d@isik.edu.tr", Password = "Gise2026!", AccountType = UserRole.Organizer, AcceptTerms = true });
        Assert.Contains(r, x => x.MemberNames.Contains(nameof(RegisterVm.OrganizationName)));
    }

    [Theory]
    [InlineData("kisa1", false)]
    [InlineData("uzunama1", false)]
    [InlineData("Uzunsifre1", true)]
    public void Password_rules(string pw, bool valid)
    {
        var r = Validate(new RegisterVm { FullName = "Deniz Baran", Username = "deniz", Email = "d@isik.edu.tr", Password = pw, AcceptTerms = true });
        Assert.Equal(valid, r.All(x => !x.MemberNames.Contains(nameof(RegisterVm.Password))));
    }

    [Fact]
    public void Event_in_the_past_or_with_duplicate_tiers_is_invalid()
    {
        var clock = new FakeClock();
        var vm = new EventFormVm
        {
            Title = "Test", Description = "Yirmi karakterden uzun bir açıklama.", Venue = "Sahne", District = "Sarıyer",
            Date = DateOnly.FromDateTime(clock.Now.AddDays(-1)), Time = new TimeOnly(20, 0),
            Tiers = [new() { Name = "Tam", Price = 100, Capacity = 10 }, new() { Name = "tam", Price = 50, Capacity = 5 }]
        };
        var r = Validate(vm, clock);
        Assert.Contains(r, x => x.ErrorMessage!.Contains("2 saat sonrası"));
        Assert.Contains(r, x => x.ErrorMessage!.Contains("iki kez"));
    }

    [Fact]
    public void Turkish_search_folding() => Assert.Equal(Text.Fold("Kadıköy İKSV Şişhane"), Text.Fold("kadikoy iksv sishane"));
}

public class ApiTests : IClassFixture<ApiTests.Factory>
{
    public class Factory : WebApplicationFactory<Program>
    {
        private readonly string _db = Path.Combine(Path.GetTempPath(), $"gise-api-{Guid.NewGuid():N}.db");
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("ConnectionStrings:Gise", $"Data Source={_db}");
        }
        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            if (File.Exists(_db)) File.Delete(_db);
        }
    }

    private readonly Factory _f;
    public ApiTests(Factory f) => _f = f;

    [Fact]
    public async Task Catalog_returns_seeded_future_events()
    {
        var list = await _f.CreateClient().GetFromJsonAsync<JsonElement>("/api/events");
        Assert.Equal(12, list.GetArrayLength());
        Assert.All(list.EnumerateArray(), e => Assert.True(e.GetProperty("tiers").GetArrayLength() > 0));
    }

    [Fact]
    public async Task Catalog_filters_by_category_and_price()
    {
        var list = await _f.CreateClient().GetFromJsonAsync<JsonElement>("/api/events?category=Klasik&maxPrice=500");
        Assert.All(list.EnumerateArray(), e =>
        {
            Assert.Equal("Klasik", e.GetProperty("category").GetString());
            Assert.True(e.GetProperty("priceFrom").GetInt32() <= 500);
        });
    }

    [Fact]
    public async Task Hold_requires_login_and_returns_problem_json()
    {
        var res = await _f.CreateClient().PostAsJsonAsync("/api/orders/hold", new { eventId = 1, lines = new[] { new { tierId = 1, quantity = 1 } } });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
        Assert.Equal("application/problem+json", res.Content.Headers.ContentType!.MediaType);
    }

    [Fact]
    public async Task Unknown_event_returns_404_problem()
    {
        var res = await _f.CreateClient().GetAsync("/api/events/99999");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Etkinlik bulunamadı.", body.GetProperty("title").GetString());
    }

    [Fact]
    public async Task Unknown_page_renders_turkish_404()
    {
        var res = await _f.CreateClient().GetAsync("/boyle-bir-sayfa-yok");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
        Assert.Contains("Sayfa bulunamadı", await res.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Admin_pages_redirect_anonymous_users_to_login()
    {
        var client = _f.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        var res = await client.GetAsync("/yonetim");
        Assert.Equal(HttpStatusCode.Redirect, res.StatusCode);
        Assert.StartsWith("/giris", res.Headers.Location!.PathAndQuery);
    }
}
