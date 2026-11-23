using Gise.Web.Data;
using Gise.Web.Infrastructure;
using Gise.Web.Models;
using Gise.Web.Services;
using Gise.Web.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Controllers;

public class EventDetailsVm
{
    public required Event Event { get; init; }
    public bool CanBuy { get; init; }
    public string? Notice { get; init; }
    public bool IsOwner { get; init; }
    public int OwnedTickets { get; init; }
}

public class EventsController(GiseDbContext db, IClock clock, AuditService audit, IWebHostEnvironment env, ILogger<EventsController> log) : Controller
{
    [HttpGet("/etkinlik/{id:int}")]
    public async Task<IActionResult> Details(int id, CancellationToken ct)
    {
        var ev = await db.Events.AsNoTracking().Include(e => e.Tiers).Include(e => e.Organizer).FirstOrDefaultAsync(e => e.Id == id, ct);
        if (ev is null) return NotFound();

        var isOwner = User.IsSignedIn() && (ev.OrganizerId == User.Id() || User.IsInRole(Roles.Admin));
        if (ev.Status != EventStatus.Published && !isOwner) return NotFound();

        string? notice = ev.Status switch
        {
            EventStatus.Draft => "Bu bir taslak; yalnızca sen görüyorsun. Profil → Etkinliklerim'den yayınlayabilirsin.",
            EventStatus.Unpublished => "Bu etkinlik yayından kaldırıldı; katılımcılar göremez.",
            _ when ev.StartsAt <= clock.Now => "Bu etkinlik sona erdi.",
            _ => null
        };
        var owned = User.IsSignedIn()
            ? await db.Tickets.CountAsync(t => t.Order!.UserId == User.Id() && t.Order.EventId == id && t.Status != TicketStatus.Cancelled, ct)
            : 0;

        ViewData["Title"] = ev.Title;
        ViewData["Nav"] = "kesfet";
        return View(new EventDetailsVm { Event = ev, CanBuy = notice is null, Notice = notice, IsOwner = isOwner, OwnedTickets = owned });
    }

    [Authorize(Roles = Roles.Organizer), HttpGet("/etkinlik/yeni")]
    public async Task<IActionResult> Create()
    {
        await SetFormViewData();
        return View(new EventFormVm { Date = DateOnly.FromDateTime(clock.Now.AddDays(14)) });
    }

    [Authorize(Roles = Roles.Organizer), HttpPost("/etkinlik/yeni"), RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<IActionResult> Create(EventFormVm vm, CancellationToken ct)
    {
        vm.Tiers = vm.Tiers.Where(t => !string.IsNullOrWhiteSpace(t.Name) || t.Price is not null || t.Capacity is not null).ToList();
        if (vm.Tiers.Count == 0) ModelState.AddModelError(nameof(vm.Tiers), "En az bir bilet türü için ad, fiyat ve kontenjan gir.");

        string? coverPath = null;
        if (ModelState.IsValid && vm.CoverUpload is { Length: > 0 } file)
        {
            coverPath = await SaveCoverAsync(file, ct);
            if (coverPath is null) ModelState.AddModelError(nameof(vm.CoverUpload), "Görsel dosyası okunamadı; JPG, PNG ya da WEBP yükle.");
        }
        if (!ModelState.IsValid)
        {
            await SetFormViewData();
            return View(vm);
        }

        var me = await db.Users.FindAsync([User.Id()], ct);
        var start = vm.Date!.Value.ToDateTime(vm.Time!.Value);
        var ev = new Event
        {
            Title = vm.Title.Trim(), Category = vm.Category, AgeLimit = vm.AgeLimit, Description = vm.Description.Trim(),
            Tags = string.IsNullOrWhiteSpace(vm.Tags) ? null : vm.Tags.Trim(),
            Venue = vm.Venue.Trim(), District = vm.District.Trim(), StartsAt = start,
            DoorsAt = vm.Doors is { } d ? vm.Date.Value.ToDateTime(d) : start.AddMinutes(-45),
            CoverImage = coverPath ?? $"/img/covers/{vm.CoverPreset}.jpg",
            OrganizerId = me!.Id, CreatedAt = clock.Now,
            Status = vm.Intent == "draft" ? EventStatus.Draft : EventStatus.Published,
            Tiers = vm.Tiers.Select((t, i) => new TicketTier { Name = t.Name.Trim(), Description = t.Description?.Trim(), Price = t.Price!.Value, Capacity = t.Capacity!.Value, SortOrder = i }).ToList()
        };
        db.Events.Add(ev);
        await db.SaveChangesAsync(ct);
        audit.Log(me.Id, me.FullName, ev.Status == EventStatus.Draft ? "event.draft" : "event.publish", $"#{ev.Id} {ev.Title}");
        await db.SaveChangesAsync(ct);

        TempData["Toast"] = ev.Status == EventStatus.Draft
            ? "Taslak kaydedildi. Yayınlayana kadar yalnızca sen görürsün."
            : "Yayınlandı. Etkinliğin Keşfet'te görünüyor.";
        return Redirect($"/etkinlik/{ev.Id}");
    }

    private async Task SetFormViewData()
    {
        var me = await db.Users.FindAsync(User.Id());
        ViewData["Title"] = "Yeni Etkinlik";
        ViewData["Nav"] = "olustur";
        ViewData["Org"] = me?.OrganizationName ?? me?.FullName;
        ViewData["MinDate"] = clock.Now.ToString("yyyy-MM-dd");
    }

    /// <summary>Stores an uploaded cover under wwwroot/uploads after checking the file's magic bytes.</summary>
    private async Task<string?> SaveCoverAsync(IFormFile file, CancellationToken ct)
    {
        var head = new byte[12];
        await using (var s = file.OpenReadStream()) _ = await s.ReadAsync(head, ct);
        string? ext = head switch
        {
            [0xFF, 0xD8, 0xFF, ..] => ".jpg",
            [0x89, 0x50, 0x4E, 0x47, ..] => ".png",
            [0x52, 0x49, 0x46, 0x46, _, _, _, _, 0x57, 0x45, 0x42, 0x50] => ".webp",
            _ => null
        };
        if (ext is null) return null;

        var dir = Path.Combine(env.WebRootPath, "uploads");
        Directory.CreateDirectory(dir);
        var name = $"{Guid.NewGuid():N}{ext}";
        try
        {
            await using var target = System.IO.File.Create(Path.Combine(dir, name));
            await file.CopyToAsync(target, ct);
        }
        catch (IOException ex)
        {
            log.LogError(ex, "Could not save cover upload");
            return null;
        }
        return $"/uploads/{name}";
    }
}
