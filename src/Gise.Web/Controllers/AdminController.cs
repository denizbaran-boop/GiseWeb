using Gise.Web.Data;
using Gise.Web.Infrastructure;
using Gise.Web.Models;
using Gise.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Controllers;

public record AdminStats(int Users, int NewThisWeek, int Organizers, int Banned, int Events, int TicketsSold, int Revenue);

[Authorize(Roles = Roles.Admin)]
public class AdminController(GiseDbContext db, IClock clock) : Controller
{
    [HttpGet("/yonetim")]
    public async Task<IActionResult> Users(CancellationToken ct)
    {
        ViewData["Stats"] = await StatsAsync(ct);
        return Page("Kullanıcılar", "users");
    }

    [HttpGet("/yonetim/etkinlikler")]
    public async Task<IActionResult> Events(CancellationToken ct)
    {
        ViewData["Stats"] = await StatsAsync(ct);
        var list = await db.Events.AsNoTracking().Include(e => e.Organizer).Include(e => e.Tiers)
            .OrderByDescending(e => e.StartsAt > clock.Now).ThenBy(e => e.StartsAt).ToListAsync(ct);
        return Page("Etkinlikler", "events", list);
    }

    [HttpGet("/yonetim/kayitlar")]
    public async Task<IActionResult> Audit(CancellationToken ct)
    {
        ViewData["Stats"] = await StatsAsync(ct);
        var logs = await db.AuditLogs.AsNoTracking().OrderByDescending(a => a.CreatedAt).Take(200).ToListAsync(ct);
        return Page("İşlem Kayıtları", "audit", logs);
    }

    private IActionResult Page(string title, string tab, object? model = null)
    {
        ViewData["Title"] = title;
        ViewData["Nav"] = "yonetim";
        ViewData["AdminTab"] = tab;
        return View(tab switch { "events" => "Events", "audit" => "Audit", _ => "Users" }, model);
    }

    private async Task<AdminStats> StatsAsync(CancellationToken ct)
    {
        var now = clock.Now;
        var users = await db.Users.AsNoTracking().Select(u => new { u.Role, u.CreatedAt, u.BannedAt, u.BannedUntil }).ToListAsync(ct);
        var sold = await db.Database.SqlQuery<int>($"SELECT COUNT(*) AS Value FROM Tickets WHERE Status <> {(int)TicketStatus.Cancelled}").SingleAsync(ct);
        var revenue = await db.Database.SqlQuery<int>($"SELECT COALESCE(SUM(Total), 0) AS Value FROM Orders WHERE Status = {(int)OrderStatus.Confirmed}").SingleAsync(ct);
        return new AdminStats(
            users.Count, users.Count(u => u.CreatedAt > now.AddDays(-7)), users.Count(u => u.Role == UserRole.Organizer),
            users.Count(u => u.BannedAt != null && (u.BannedUntil == null || u.BannedUntil > now)),
            await db.Events.CountAsync(e => e.Status == EventStatus.Published && e.StartsAt > now, ct), sold, revenue);
    }
}

[Authorize(Roles = Roles.OrganizerOrAdmin)]
public class CheckInController(GiseDbContext db, IClock clock) : Controller
{
    [HttpGet("/giris-kontrol")]
    public async Task<IActionResult> Index(int? etkinlik, CancellationToken ct)
    {
        var now = clock.Now;
        var q = db.Events.AsNoTracking().Where(e => e.Status == EventStatus.Published && e.StartsAt > now.AddHours(-12));
        if (!User.IsInRole(Roles.Admin)) q = q.Where(e => e.OrganizerId == User.Id());
        var events = await q.OrderBy(e => e.StartsAt).ToListAsync(ct);

        ViewData["Title"] = "Giriş Kontrolü";
        ViewData["Nav"] = User.IsInRole(Roles.Admin) ? "yonetim" : "olustur";
        ViewData["Selected"] = etkinlik is { } id && events.Any(e => e.Id == id) ? id : events.FirstOrDefault()?.Id;
        return View(events);
    }
}
