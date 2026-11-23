using Gise.Web.Data;
using Gise.Web.Helpers;
using Gise.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Services;

public static class Catalog
{
    public static readonly string[] Categories = ["Konser", "Tiyatro", "Komedi", "Klasik", "Festival", "Spor", "Atölye", "Konferans", "Aile"];
    public static readonly string[] AgeLimits = ["Herkes", "+7", "+12", "+16", "+18"];
    public const int CoverPresets = 12;
}

public record EventFilter(string? Q = null, string? Category = null, string? Sort = null, int? MaxPrice = null, DateOnly? From = null, DateOnly? To = null);

public record TierDto(int Id, string Name, string? Description, int Price, int Available, int Capacity);

/// <summary>Shape returned by GET /api/events — also used by the assistant and the discover grid.</summary>
public record EventDto(
    int Id, string Title, string Category, string Venue, string District, string Organizer, string AgeLimit,
    DateTime StartsAt, string Date, string Time, string Doors, string ShortDate, string LongDate, string DayNum, string Month,
    int PriceFrom, int Left, int Capacity, string Cover, string Url, string Description, string? Tags, IReadOnlyList<TierDto> Tiers);

public class EventQueryService(GiseDbContext db, IClock clock)
{
    private IQueryable<Event> Live() =>
        db.Events.AsNoTracking().Include(e => e.Tiers).Include(e => e.Organizer)
          .Where(e => e.Status == EventStatus.Published && e.StartsAt > clock.Now);

    public async Task<List<Event>> SearchAsync(EventFilter f, CancellationToken ct = default)
    {
        var q = Live();
        if (!string.IsNullOrWhiteSpace(f.Category) && Catalog.Categories.Contains(f.Category)) q = q.Where(e => e.Category == f.Category);
        if (f.From is { } from) q = q.Where(e => e.StartsAt >= from.ToDateTime(TimeOnly.MinValue));
        if (f.To is { } to) q = q.Where(e => e.StartsAt < to.AddDays(1).ToDateTime(TimeOnly.MinValue));

        IEnumerable<Event> list = await q.ToListAsync(ct);

        // Text search runs in memory so Turkish characters fold correctly (SQLite LIKE is ASCII-only).
        var terms = Text.Fold(f.Q).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (terms.Length > 0)
            list = list.Where(e =>
            {
                var hay = Text.Fold($"{e.Title} {e.Venue} {e.District} {e.Category} {e.Organizer?.OrganizationName} {e.Tags}");
                return terms.All(hay.Contains);
            });
        if (f.MaxPrice is > 0) list = list.Where(e => PriceFrom(e) <= f.MaxPrice);

        return (f.Sort switch
        {
            "price" => list.OrderBy(PriceFrom).ThenBy(e => e.StartsAt),
            "popular" => list.OrderByDescending(e => e.Tiers.Sum(t => t.Sold) / (double)Math.Max(1, e.Tiers.Sum(t => t.Capacity))),
            _ => list.OrderBy(e => e.StartsAt),
        }).ToList();
    }

    public static int PriceFrom(Event e) => e.Tiers.Count == 0 ? 0 : e.Tiers.Min(t => t.Price);
    public static int Left(Event e) => e.Tiers.Sum(t => t.Available);
    public static int Capacity(Event e) => e.Tiers.Sum(t => t.Capacity);

    public static EventDto ToDto(Event e) => new(
        e.Id, e.Title, e.Category, e.Venue, e.District, e.Organizer?.OrganizationName ?? e.Organizer?.FullName ?? "", e.AgeLimit,
        e.StartsAt, e.StartsAt.ToString("yyyy-MM-dd"), e.StartsAt.ToString("HH:mm"), e.DoorsAt.ToString("HH:mm"),
        Ui.ShortDate(e.StartsAt), Ui.LongDate(e.StartsAt), e.StartsAt.Day.ToString(), Ui.MonthShortUpper(e.StartsAt),
        PriceFrom(e), Left(e), Capacity(e), e.CoverImage, $"/etkinlik/{e.Id}", e.Description, e.Tags,
        e.Tiers.OrderBy(t => t.SortOrder).Select(t => new TierDto(t.Id, t.Name, t.Description, t.Price, t.Available, t.Capacity)).ToList());
}
