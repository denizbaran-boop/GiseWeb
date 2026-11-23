using Gise.Web.Data;
using Gise.Web.Infrastructure;
using Gise.Web.Models;
using Gise.Web.Services;
using Gise.Web.ViewModels;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Controllers;

public class DiscoverVm
{
    public required List<Event> Events { get; init; }
    public List<Event> Recommended { get; init; } = [];
    public string? Q { get; init; }
    public string Category { get; init; } = "Tümü";
    public string Sort { get; init; } = "date";
    public int? MaxPrice { get; init; }
}

public class HomeController(EventQueryService events, GiseDbContext db) : Controller
{
    [HttpGet("/")]
    public async Task<IActionResult> Index(string? q, string? kategori, string? sirala, int? enFazla, CancellationToken ct)
    {
        var cat = Catalog.Categories.Contains(kategori) ? kategori! : "Tümü";
        var sort = sirala is "price" or "popular" ? sirala : "date";
        var list = await events.SearchAsync(new EventFilter(q, cat, sort, enFazla), ct);

        // FR-08 (simple content-based version): events in categories the user has bought before.
        var recommended = new List<Event>();
        if (User.IsSignedIn() && string.IsNullOrWhiteSpace(q) && cat == "Tümü")
        {
            var uid = User.Id();
            var mine = await db.Orders.Where(o => o.UserId == uid && o.Status == OrderStatus.Confirmed)
                .Select(o => new { o.EventId, o.Event!.Category }).ToListAsync(ct);
            var cats = mine.Select(m => m.Category).ToHashSet();
            var owned = mine.Select(m => m.EventId).ToHashSet();
            recommended = (await events.SearchAsync(new EventFilter(), ct))
                .Where(e => cats.Contains(e.Category) && !owned.Contains(e.Id)).Take(4).ToList();
        }

        ViewData["Title"] = "Keşfet";
        ViewData["Nav"] = "kesfet";
        return View(new DiscoverVm { Events = list, Recommended = recommended, Q = q, Category = cat, Sort = sort, MaxPrice = enFazla });
    }

    [Route("/durum/{code:int}"), IgnoreAntiforgeryToken] // any method: status pages are re-executed with the original verb
    public IActionResult Status(int code, string? trace)
    {
        // When re-executed by UseStatusCodePagesWithReExecute keep the original status code.
        var reexec = HttpContext.Features.Get<IStatusCodeReExecuteFeature>();
        Response.StatusCode = reexec is null && code == 500 ? 500 : code;
        return View("Status", new StatusVm(code, null, trace));
    }

    [Route("/erisim-yok"), IgnoreAntiforgeryToken]
    public IActionResult AccessDenied()
    {
        Response.StatusCode = 403;
        return View("Status", new StatusVm(403));
    }

}
