using Gise.Web.Data;
using Gise.Web.Models;
using Gise.Web.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Services;

/// <summary>
/// Create / update / delete of events (the principal entity) for organizers and admins.
/// Seat counts are guarded with SQL so an edit can never push capacity below tickets already sold.
/// </summary>
public class EventManagementService(GiseDbContext db, IClock clock, AuditService audit, IWebHostEnvironment env)
{
    public async Task<Event> CreateAsync(int organizerId, EventFormVm vm, string cover, CancellationToken ct = default)
    {
        var me = await db.Users.FindAsync([organizerId], ct) ?? throw new DomainException("Oturum bulunamadı.", 401);
        var ev = new Event { OrganizerId = me.Id, CreatedAt = clock.Now, CoverImage = cover, Status = vm.Intent == "draft" ? EventStatus.Draft : EventStatus.Published };
        Apply(ev, vm);
        ev.Tiers = vm.Tiers.Select((t, i) => new TicketTier { Name = t.Name.Trim(), Description = t.Description?.Trim(), Price = t.Price!.Value, Capacity = t.Capacity!.Value, SortOrder = i }).ToList();
        db.Events.Add(ev);
        await db.SaveChangesAsync(ct);
        audit.Log(me.Id, me.FullName, ev.Status == EventStatus.Draft ? "event.draft" : "event.publish", $"#{ev.Id} {ev.Title}");
        await db.SaveChangesAsync(ct);
        return ev;
    }

    /// <summary>Loads an event the actor may edit: their own (or any, for admins) and not finished yet.</summary>
    public async Task<Event> GetEditableAsync(int actorId, bool isAdmin, int id, CancellationToken ct = default)
    {
        var ev = await db.Events.Include(e => e.Tiers).FirstOrDefaultAsync(e => e.Id == id, ct) ?? throw new DomainException("Etkinlik bulunamadı.", 404);
        if (!isAdmin && ev.OrganizerId != actorId) throw new DomainException("Bu etkinlik sana ait değil.", 403);
        if (ev.StartsAt <= clock.Now) throw new DomainException("Sona ermiş bir etkinlik düzenlenemez.", 409);
        return ev;
    }

    public async Task<Event> UpdateAsync(int actorId, bool isAdmin, int id, EventFormVm vm, string? newCover, CancellationToken ct = default)
    {
        var ev = await GetEditableAsync(actorId, isAdmin, id, ct);
        var me = await db.Users.FindAsync([actorId], ct);

        var keptIds = vm.Tiers.Where(t => t.Id is > 0).Select(t => t.Id!.Value).ToHashSet();
        if (keptIds.Any(tid => ev.Tiers.All(t => t.Id != tid))) throw new DomainException("Bilet türü bu etkinliğe ait değil.", 400, nameof(vm.Tiers));

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        // Removed tiers: only allowed while nobody holds a seat in them.
        foreach (var removed in ev.Tiers.Where(t => !keptIds.Contains(t.Id)).ToList())
        {
            if (removed.Sold > 0 || await db.OrderItems.AnyAsync(i => i.TierId == removed.Id && i.Order!.Status != OrderStatus.Expired && i.Order.Status != OrderStatus.Cancelled, ct))
                throw new DomainException($"\"{removed.Name}\" türünde satılmış bilet var; bu tür silinemez (kontenjanını azaltabilirsin).", 409, nameof(vm.Tiers));
            // Abandoned holds still point at the tier; they carry no tickets, so they can go.
            await db.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM OrderItems WHERE TierId = {removed.Id}", ct);
            db.TicketTiers.Remove(removed);
        }

        Apply(ev, vm);
        if (newCover is not null) ev.CoverImage = newCover;
        if (vm.Intent == "publish") ev.Status = EventStatus.Published;
        else if (vm.Intent == "draft" && ev.Status != EventStatus.Published) ev.Status = EventStatus.Draft;

        for (int i = 0; i < vm.Tiers.Count; i++)
        {
            var t = vm.Tiers[i];
            if (t.Id is > 0)
            {
                var tier = ev.Tiers.First(x => x.Id == t.Id);
                tier.Name = t.Name.Trim(); tier.Description = t.Description?.Trim(); tier.Price = t.Price!.Value; tier.SortOrder = i;
            }
            else
            {
                ev.Tiers.Add(new TicketTier { Name = t.Name.Trim(), Description = t.Description?.Trim(), Price = t.Price!.Value, Capacity = t.Capacity!.Value, SortOrder = i });
            }
        }
        await db.SaveChangesAsync(ct);

        // Capacity changes: a single conditional UPDATE so a concurrent purchase can't slip under the new limit.
        foreach (var t in vm.Tiers.Where(t => t.Id is > 0))
        {
            var updated = await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE TicketTiers SET Capacity = {t.Capacity!.Value} WHERE Id = {t.Id!.Value} AND Sold <= {t.Capacity!.Value}", ct);
            if (updated == 0)
            {
                var sold = await db.TicketTiers.Where(x => x.Id == t.Id).Select(x => x.Sold).FirstAsync(ct);
                throw new DomainException($"\"{t.Name}\" kontenjanı satılan bilet sayısından ({sold}) az olamaz.", 409, nameof(vm.Tiers));
            }
        }

        audit.Log(me!.Id, me.FullName, "event.update", $"#{ev.Id} {ev.Title}");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return ev;
    }

    /// <summary>Deletes an event that has no sold or held tickets. Events with sales can only be unpublished.</summary>
    public async Task DeleteAsync(int actorId, bool isAdmin, int id, CancellationToken ct = default)
    {
        var ev = await db.Events.Include(e => e.Tiers).FirstOrDefaultAsync(e => e.Id == id, ct) ?? throw new DomainException("Etkinlik bulunamadı.", 404);
        if (!isAdmin && ev.OrganizerId != actorId) throw new DomainException("Bu etkinlik sana ait değil.", 403);
        if (ev.Tiers.Any(t => t.Sold > 0) || await db.Orders.AnyAsync(o => o.EventId == id && (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Pending), ct))
            throw new DomainException("Bu etkinlik için satılmış bilet var; silmek yerine yayından kaldırabilirsin.", 409);

        var me = await db.Users.FindAsync([actorId], ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        // Cancelled / expired orders are only history; remove them together with the event.
        await db.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM OrderItems WHERE OrderId IN (SELECT Id FROM Orders WHERE EventId = {id})", ct);
        await db.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM Orders WHERE EventId = {id}", ct);
        db.Events.Remove(ev); // ticket tiers are removed by the cascade
        audit.Log(me!.Id, me.FullName, "event.delete", $"#{ev.Id} {ev.Title}");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        DeleteUploadedCover(ev.CoverImage);
    }

    public static EventFormVm ToForm(Event e) => new()
    {
        Id = e.Id, Title = e.Title, Category = e.Category, AgeLimit = e.AgeLimit, Description = e.Description, Tags = e.Tags,
        Date = DateOnly.FromDateTime(e.StartsAt), Time = TimeOnly.FromDateTime(e.StartsAt), Doors = TimeOnly.FromDateTime(e.DoorsAt),
        Venue = e.Venue, District = e.District, CoverPreset = 0, CurrentCover = e.CoverImage, CurrentStatus = e.Status, Intent = "save",
        Tiers = e.Tiers.OrderBy(t => t.SortOrder).Select(t => new TierFormVm { Id = t.Id, Name = t.Name, Description = t.Description, Price = t.Price, Capacity = t.Capacity }).ToList()
    };

    private static void Apply(Event ev, EventFormVm vm)
    {
        var start = vm.Date!.Value.ToDateTime(vm.Time!.Value);
        ev.Title = vm.Title.Trim(); ev.Category = vm.Category; ev.AgeLimit = vm.AgeLimit; ev.Description = vm.Description.Trim();
        ev.Tags = string.IsNullOrWhiteSpace(vm.Tags) ? null : vm.Tags.Trim();
        ev.Venue = vm.Venue.Trim(); ev.District = vm.District.Trim(); ev.StartsAt = start;
        ev.DoorsAt = vm.Doors is { } d ? vm.Date.Value.ToDateTime(d) : start.AddMinutes(-45);
    }

    private void DeleteUploadedCover(string cover)
    {
        if (!cover.StartsWith("/uploads/")) return;
        var path = Path.Combine(env.WebRootPath, "uploads", Path.GetFileName(cover));
        try { if (File.Exists(path)) File.Delete(path); } catch (IOException) { /* a leftover file is harmless */ }
    }
}
