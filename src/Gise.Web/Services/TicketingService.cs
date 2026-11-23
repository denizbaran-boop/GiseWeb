using Gise.Web.Data;
using Gise.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Services;

public record HoldLine(int TierId, int Quantity);
public class CheckInCounts { public int CheckedIn { get; set; } public int Issued { get; set; } }
public record CheckInResult(string AttendeeName, string TierName, string Code, int CheckedIn, int Issued);

/// <summary>
/// Ticket purchase workflow: hold seats (10 min) → pay → issue tickets; plus refunds and door check-in.
/// Seat counts are changed with single conditional UPDATE statements inside a transaction,
/// so two buyers can never take the last seat at the same time (NFR-04).
/// </summary>
public class TicketingService(GiseDbContext db, IClock clock, TicketTokenService tokens, AuditService audit)
{
    public const int MaxPerUserPerEvent = 6;
    public static readonly TimeSpan HoldDuration = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan RefundWindow = TimeSpan.FromHours(48);

    public async Task<Order> HoldAsync(int userId, int eventId, IEnumerable<HoldLine> requested, CancellationToken ct = default)
    {
        var now = clock.Now;
        var user = await db.Users.FindAsync([userId], ct) ?? throw new DomainException("Oturumun sona ermiş; yeniden giriş yap.", 401);
        if (user.IsBanned(now)) throw new DomainException("Hesabın askıya alındığı için bilet alamazsın.", 403);

        var ev = await db.Events.Include(e => e.Tiers).AsNoTracking().FirstOrDefaultAsync(e => e.Id == eventId, ct)
                 ?? throw new DomainException("Etkinlik bulunamadı.", 404);
        if (ev.Status != EventStatus.Published) throw new DomainException("Bu etkinlik şu an satışta değil.", 409);
        if (ev.StartsAt <= now) throw new DomainException("Etkinlik başladı; bilet satışı kapandı.", 409);

        var lines = requested.Where(l => l.Quantity > 0)
            .GroupBy(l => l.TierId).Select(g => new HoldLine(g.Key, g.Sum(x => x.Quantity))).ToList();
        if (lines.Count == 0) throw new DomainException("En az bir bilet seç.", 400, "lines");
        foreach (var l in lines)
            if (ev.Tiers.All(t => t.Id != l.TierId)) throw new DomainException("Seçilen bilet türü bu etkinliğe ait değil.", 400, "lines");

        var qty = lines.Sum(l => l.Quantity);
        var owned = await db.Tickets.CountAsync(t => t.Order!.UserId == userId && t.Order.EventId == eventId && t.Status != TicketStatus.Cancelled, ct);
        if (owned + qty > MaxPerUserPerEvent)
            throw new DomainException(owned == 0
                ? $"Kişi başı en fazla {MaxPerUserPerEvent} bilet alınabilir."
                : $"Kişi başı en fazla {MaxPerUserPerEvent} bilet alınabilir; bu etkinlik için zaten {owned} biletin var.", 409, "lines");

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        // An unpaid hold for the same event is replaced by the new selection.
        var previous = await db.Orders.Include(o => o.Items)
            .Where(o => o.UserId == userId && o.EventId == eventId && o.Status == OrderStatus.Pending).ToListAsync(ct);
        foreach (var p in previous) await ReleaseAsync(p, OrderStatus.Cancelled, ct);

        foreach (var l in lines)
        {
            // Check and update in one statement: no other buyer can take the seats in between.
            var updated = await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE TicketTiers SET Sold = Sold + {l.Quantity} WHERE Id = {l.TierId} AND Sold + {l.Quantity} <= Capacity", ct);
            if (updated == 0)
            {
                await tx.RollbackAsync(ct);
                var tier = await db.TicketTiers.AsNoTracking().FirstAsync(t => t.Id == l.TierId, ct);
                throw new DomainException(tier.Available == 0
                    ? $"{tier.Name} biletleri tükendi."
                    : $"{tier.Name} için yalnızca {tier.Available} bilet kaldı.", 409, "lines");
            }
        }

        var order = new Order
        {
            Code = Codes.OrderCode(), UserId = userId, EventId = eventId, Status = OrderStatus.Pending,
            CreatedAt = now, ExpiresAt = now + HoldDuration,
            Items = lines.Select(l => new OrderItem { TierId = l.TierId, Quantity = l.Quantity, UnitPrice = ev.Tiers.First(t => t.Id == l.TierId).Price }).ToList()
        };
        order.Total = order.Items.Sum(i => i.Quantity * i.UnitPrice);
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return order;
    }

    public async Task<Order> PayAsync(int userId, string code, string cardNumber, CancellationToken ct = default)
    {
        var now = clock.Now;
        var order = await db.Orders.Include(o => o.Items).Include(o => o.User).Include(o => o.Event)
            .FirstOrDefaultAsync(o => o.Code == code && o.UserId == userId, ct)
            ?? throw new DomainException("Sipariş bulunamadı.", 404);

        if (order.Status == OrderStatus.Confirmed) return order; // idempotent: double-click on "Öde"
        if (order.Status != OrderStatus.Pending) throw new DomainException("Bu rezervasyon artık geçerli değil; biletleri yeniden seç.", 410);
        if (order.ExpiresAt <= now)
        {
            await ReleaseAsync(order, OrderStatus.Expired, ct);
            await db.SaveChangesAsync(ct);
            throw new DomainException("10 dakikalık rezervasyon süren doldu; biletleri yeniden seç.", 410);
        }
        if (order.User!.IsBanned(now)) throw new DomainException("Hesabın askıya alındığı için ödeme yapılamaz.", 403);

        // Mock gateway: the card number is validated, never stored; only the last 4 digits are kept (NFR-02).
        var digits = new string(cardNumber.Where(char.IsDigit).ToArray());
        if (digits.EndsWith("0002")) throw new DomainException("Bankan ödemeyi reddetti. Başka bir kart dene.", 402, "cardNumber");

        foreach (var item in order.Items)
            for (int i = 0; i < item.Quantity; i++)
                order.Tickets.Add(new Ticket { TierId = item.TierId, Code = Codes.TicketCode(), Status = TicketStatus.Issued, IssuedAt = now });

        order.Status = OrderStatus.Confirmed;
        order.PaidAt = now;
        order.ExpiresAt = null;
        order.CardLast4 = digits[^4..];
        audit.Log(userId, order.User.FullName, "order.paid", $"{order.Code} · {order.Event!.Title} · {order.Tickets.Count} bilet · ₺{order.Total}");
        await db.SaveChangesAsync(ct);
        return order;
    }

    public async Task CancelHoldAsync(int userId, string code, CancellationToken ct = default)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Code == code && o.UserId == userId, ct);
        if (order is null || order.Status != OrderStatus.Pending) return;
        await ReleaseAsync(order, OrderStatus.Cancelled, ct);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>FR-11: an attendee may cancel a ticket until 48 hours before the event.</summary>
    public async Task<int> CancelTicketAsync(int userId, int ticketId, CancellationToken ct = default)
    {
        var now = clock.Now;
        var ticket = await db.Tickets.Include(t => t.Order).ThenInclude(o => o!.Event).Include(t => t.Order).ThenInclude(o => o!.Items).Include(t => t.Order).ThenInclude(o => o!.User)
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.Order!.UserId == userId, ct)
            ?? throw new DomainException("Bilet bulunamadı.", 404);
        if (ticket.Status == TicketStatus.Cancelled) throw new DomainException("Bu bilet zaten iptal edilmiş.", 409);
        if (ticket.Status == TicketStatus.Redeemed) throw new DomainException("Kullanılmış bilet iptal edilemez.", 409);
        if (ticket.Order!.Event!.StartsAt - now < RefundWindow) throw new DomainException("İade süresi doldu: etkinliğe 48 saatten az kaldı.", 409);

        ticket.Status = TicketStatus.Cancelled;
        ticket.CancelledAt = now;
        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE TicketTiers SET Sold = Sold - 1 WHERE Id = {ticket.TierId} AND Sold > 0", ct);
        var refund = ticket.Order.Items.First(i => i.TierId == ticket.TierId).UnitPrice;
        audit.Log(userId, ticket.Order.User!.FullName, "ticket.refund", $"{ticket.Code} · {ticket.Order.Event.Title} · ₺{refund} iade");
        await db.SaveChangesAsync(ct);
        return refund;
    }

    /// <summary>FR-10: validates a scanned/typed ticket and marks it redeemed.</summary>
    public async Task<CheckInResult> CheckInAsync(int actorId, bool isAdmin, int eventId, string input, CancellationToken ct = default)
    {
        var ev = await db.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == eventId, ct) ?? throw new DomainException("Etkinlik bulunamadı.", 404);
        if (!isAdmin && ev.OrganizerId != actorId) throw new DomainException("Bu etkinliğin girişini yalnızca organizatörü yapabilir.", 403);

        var code = tokens.Parse(input) ?? throw new DomainException("Kod okunamadı veya QR imzası geçersiz.", 400, "code");
        var ticket = await db.Tickets.Include(t => t.Tier).Include(t => t.Order).ThenInclude(o => o!.User).Include(t => t.Order).ThenInclude(o => o!.Event)
            .FirstOrDefaultAsync(t => t.Code == code, ct) ?? throw new DomainException($"{code} koduyla bir bilet bulunamadı.", 404, "code");

        if (ticket.Order!.EventId != eventId) throw new DomainException($"Bu bilet başka bir etkinliğe ait: {ticket.Order.Event!.Title}.", 409, "code");
        if (ticket.Status == TicketStatus.Cancelled) throw new DomainException("Bu bilet iptal edilmiş; giriş yapılamaz.", 409, "code");
        if (ticket.Status == TicketStatus.Redeemed) throw new DomainException($"Bu bilet zaten kullanıldı ({ticket.RedeemedAt:HH:mm}).", 409, "code");

        ticket.Status = TicketStatus.Redeemed;
        ticket.RedeemedAt = clock.Now;
        await db.SaveChangesAsync(ct);

        var (checkedIn, issued) = await CheckInStatsAsync(eventId, ct);
        return new CheckInResult(ticket.Order.User!.FullName, ticket.Tier!.Name, ticket.Code, checkedIn, issued);
    }

    public async Task<(int CheckedIn, int Issued)> CheckInStatsAsync(int eventId, CancellationToken ct = default)
    {
        var row = await db.Database.SqlQuery<CheckInCounts>($"""
            SELECT COALESCE(SUM(CASE WHEN t.Status = {(int)TicketStatus.Redeemed} THEN 1 ELSE 0 END), 0) AS CheckedIn,
                   COUNT(t.Id) AS Issued
            FROM Tickets t JOIN Orders o ON o.Id = t.OrderId
            WHERE o.EventId = {eventId} AND t.Status <> {(int)TicketStatus.Cancelled}
            """).SingleAsync(ct);
        return (row.CheckedIn, row.Issued);
    }

    /// <summary>Releases holds whose 10 minutes are up. Called by <see cref="HoldCleanupService"/>.</summary>
    public async Task<int> ExpireStaleHoldsAsync(CancellationToken ct = default)
    {
        var now = clock.Now;
        var stale = await db.Orders.Include(o => o.Items).Where(o => o.Status == OrderStatus.Pending && o.ExpiresAt <= now).ToListAsync(ct);
        foreach (var o in stale) await ReleaseAsync(o, OrderStatus.Expired, ct);
        if (stale.Count > 0) await db.SaveChangesAsync(ct);
        return stale.Count;
    }

    private async Task ReleaseAsync(Order order, OrderStatus status, CancellationToken ct)
    {
        foreach (var item in order.Items)
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE TicketTiers SET Sold = Sold - {item.Quantity} WHERE Id = {item.TierId} AND Sold >= {item.Quantity}", ct);
        order.Status = status;
        order.ExpiresAt = null;
    }
}

public class HoldCleanupService(IServiceScopeFactory scopes, ILogger<HoldCleanupService> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopes.CreateScope();
                var n = await scope.ServiceProvider.GetRequiredService<TicketingService>().ExpireStaleHoldsAsync(stoppingToken);
                if (n > 0) log.LogInformation("Released {Count} expired ticket holds", n);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                log.LogError(ex, "Hold cleanup failed");
            }
        }
    }
}
