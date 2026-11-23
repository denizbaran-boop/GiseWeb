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
    public bool Editable { get; init; }
}

public class EventsController(GiseDbContext db, IClock clock, EventManagementService events, IWebHostEnvironment env, ILogger<EventsController> log) : Controller
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
        return View(new EventDetailsVm { Event = ev, CanBuy = notice is null, Notice = notice, IsOwner = isOwner, OwnedTickets = owned, Editable = isOwner && ev.StartsAt > clock.Now });
    }

    [Authorize(Roles = Roles.Organizer), HttpGet("/etkinlik/yeni")]
    public async Task<IActionResult> Create()
    {
        await SetFormViewData();
        return View("Form", new EventFormVm { Date = DateOnly.FromDateTime(clock.Now.AddDays(14)) });
    }

    [Authorize(Roles = Roles.Organizer), HttpPost("/etkinlik/yeni"), RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<IActionResult> Create(EventFormVm vm, CancellationToken ct)
    {
        vm.Id = null;
        var cover = await PrepareAsync(vm, ct);
        if (!ModelState.IsValid) return await FormView(vm);

        var ev = await events.CreateAsync(User.Id(), vm, cover ?? $"/img/covers/{vm.CoverPreset}.jpg", ct);
        TempData["Toast"] = ev.Status == EventStatus.Draft
            ? "Taslak kaydedildi. Yayınlayana kadar yalnızca sen görürsün."
            : "Yayınlandı. Etkinliğin Keşfet'te görünüyor.";
        return Redirect($"/etkinlik/{ev.Id}");
    }

    [Authorize(Roles = Roles.OrganizerOrAdmin), HttpGet("/etkinlik/{id:int}/duzenle")]
    public async Task<IActionResult> Edit(int id, CancellationToken ct)
    {
        var ev = await events.GetEditableAsync(User.Id(), User.IsInRole(Roles.Admin), id, ct);
        return await FormView(EventManagementService.ToForm(ev));
    }

    [Authorize(Roles = Roles.OrganizerOrAdmin), HttpPost("/etkinlik/{id:int}/duzenle"), RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<IActionResult> Edit(int id, EventFormVm vm, CancellationToken ct)
    {
        var current = await events.GetEditableAsync(User.Id(), User.IsInRole(Roles.Admin), id, ct);
        vm.Id = id;
        vm.CurrentCover = current.CoverImage;
        vm.CurrentStatus = current.Status;
        var cover = await PrepareAsync(vm, ct);
        if (ModelState.IsValid)
        {
            try
            {
                await events.UpdateAsync(User.Id(), User.IsInRole(Roles.Admin), id, vm, cover ?? (vm.CoverPreset > 0 ? $"/img/covers/{vm.CoverPreset}.jpg" : null), ct);
                TempData["Toast"] = "Değişiklikler kaydedildi.";
                return Redirect($"/etkinlik/{id}");
            }
            catch (DomainException ex) when (ex.StatusCode is 400 or 409)
            {
                ModelState.AddModelError(ex.Field ?? "", ex.Message); // e.g. capacity below tickets sold
            }
        }
        return await FormView(vm);
    }

    /// <summary>Drops empty tier rows and saves an uploaded cover; returns the cover path or null.</summary>
    private async Task<string?> PrepareAsync(EventFormVm vm, CancellationToken ct)
    {
        vm.Tiers = vm.Tiers.Where(t => t.Id is > 0 || !string.IsNullOrWhiteSpace(t.Name) || t.Price is not null || t.Capacity is not null).ToList();
        if (vm.Tiers.Count == 0) ModelState.AddModelError(nameof(vm.Tiers), "En az bir bilet türü için ad, fiyat ve kontenjan gir.");
        if (!ModelState.IsValid || vm.CoverUpload is not { Length: > 0 } file) return null;
        var path = await SaveCoverAsync(file, ct);
        if (path is null) ModelState.AddModelError(nameof(vm.CoverUpload), "Görsel dosyası okunamadı; JPG, PNG ya da WEBP yükle.");
        return path;
    }

    private async Task<IActionResult> FormView(EventFormVm vm)
    {
        await SetFormViewData(vm.IsEdit);
        return View("Form", vm);
    }

    private async Task SetFormViewData(bool edit = false)
    {
        var me = await db.Users.FindAsync(User.Id());
        ViewData["Title"] = edit ? "Etkinliği Düzenle" : "Yeni Etkinlik";
        ViewData["Nav"] = edit ? "profil" : "olustur";
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
