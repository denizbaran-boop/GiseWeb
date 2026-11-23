using Gise.Web.Data;
using Gise.Web.Infrastructure;
using Gise.Web.Models;
using Gise.Web.Services;
using Gise.Web.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Controllers;

public record TicketRow(Ticket Ticket, Order Order, Event Event, TicketTier Tier);
public record OrganizerEventRow(Event Event, int Sold, int Capacity, int Revenue, int CheckedIn, int Issued);

public class ProfileVm
{
    public required User Me { get; init; }
    public required string Tab { get; init; }
    public List<TicketRow> Upcoming { get; init; } = [];
    public List<TicketRow> Past { get; init; } = [];
    public List<OrganizerEventRow> MyEvents { get; init; } = [];
    public int ActiveCount { get; init; }
    public int AttendedCount { get; init; }
}

public class ProfileController(GiseDbContext db, IClock clock) : Controller
{
    [Authorize, HttpGet("/profil")]
    public async Task<IActionResult> Index(string? sekme, CancellationToken ct)
    {
        var me = await db.Users.FindAsync([User.Id()], ct);
        if (me is null) return Challenge();
        var now = clock.Now;

        var rows = await db.Tickets.AsNoTracking()
            .Where(t => t.Order!.UserId == me.Id && t.Order.Status == OrderStatus.Confirmed)
            .Select(t => new TicketRow(t, t.Order!, t.Order!.Event!, t.Tier!))
            .ToListAsync(ct);

        var upcoming = rows.Where(r => r.Event.StartsAt > now && r.Ticket.Status != TicketStatus.Cancelled).OrderBy(r => r.Event.StartsAt).ThenBy(r => r.Ticket.Id).ToList();
        var past = rows.Where(r => r.Event.StartsAt <= now || r.Ticket.Status == TicketStatus.Cancelled).OrderByDescending(r => r.Event.StartsAt).ToList();

        var myEvents = new List<OrganizerEventRow>();
        if (me.Role == UserRole.Organizer)
        {
            var evs = await db.Events.AsNoTracking().Include(e => e.Tiers).Where(e => e.OrganizerId == me.Id).OrderBy(e => e.StartsAt).ToListAsync(ct);
            var ids = evs.Select(e => e.Id).ToList();
            var tickets = await db.Tickets.AsNoTracking().Where(t => ids.Contains(t.Order!.EventId) && t.Status != TicketStatus.Cancelled)
                .GroupBy(t => t.Order!.EventId)
                .Select(g => new { EventId = g.Key, Issued = g.Count(), CheckedIn = g.Count(t => t.Status == TicketStatus.Redeemed) })
                .ToListAsync(ct);
            myEvents = evs.Select(e =>
            {
                var t = tickets.FirstOrDefault(x => x.EventId == e.Id);
                return new OrganizerEventRow(e, e.Tiers.Sum(x => x.Sold), e.Tiers.Sum(x => x.Capacity), e.Tiers.Sum(x => x.Sold * x.Price), t?.CheckedIn ?? 0, t?.Issued ?? 0);
            }).ToList();
        }

        var tab = sekme switch
        {
            "gecmis" => "past",
            "etkinliklerim" when me.Role == UserRole.Organizer => "mine",
            _ => "upcoming"
        };

        ViewData["Title"] = "Profil";
        ViewData["Nav"] = "profil";
        return View(new ProfileVm
        {
            Me = me, Tab = tab, Upcoming = upcoming, Past = past, MyEvents = myEvents,
            ActiveCount = upcoming.Count,
            AttendedCount = past.Where(r => r.Ticket.Status == TicketStatus.Redeemed).Select(r => r.Event.Id).Distinct().Count()
        });
    }
}

public class TicketsController(GiseDbContext db, TicketTokenService tokens, QrService qr) : Controller
{
    /// <summary>Order confirmation page shown after payment.</summary>
    [Authorize, HttpGet("/bilet/{code}")]
    public async Task<IActionResult> Order(string code, CancellationToken ct)
    {
        var order = await db.Orders.AsNoTracking().Include(o => o.Event).Include(o => o.Tickets).ThenInclude(t => t.Tier)
            .FirstOrDefaultAsync(o => o.Code == code && o.UserId == User.Id(), ct);
        if (order is null) return NotFound();
        if (order.Status != OrderStatus.Confirmed) return Redirect($"/etkinlik/{order.EventId}");

        ViewData["Title"] = "Biletlerin hazır";
        ViewData["Nav"] = "profil";
        ViewData["Qr"] = order.Tickets.ToDictionary(t => t.Id, t => qr.Svg(tokens.TokenFor(t.Code)));
        return View(order);
    }

    /// <summary>Pass partial loaded with fetch() into the "Bileti Göster" sheet.</summary>
    [Authorize, HttpGet("/bilet/goster/{id:int}")]
    public async Task<IActionResult> Pass(int id, CancellationToken ct)
    {
        var t = await db.Tickets.AsNoTracking().Include(x => x.Tier).Include(x => x.Order).ThenInclude(o => o!.Event)
            .FirstOrDefaultAsync(x => x.Id == id && x.Order!.UserId == User.Id(), ct);
        if (t is null) return NotFound();
        return PartialView("_Pass", new PassVm(t, t.Order!, t.Order!.Event!, qr.Svg(tokens.TokenFor(t.Code))));
    }
}

public record PassVm(Ticket Ticket, Order Order, Event Event, string QrSvg);
