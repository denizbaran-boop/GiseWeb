using Gise.Web.Data;
using Gise.Web.Models;
using Gise.Web.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Gise.Tests;

public class FakeClock : IClock
{
    public DateTime Now { get; set; } = new(2026, 12, 1, 12, 0, 0);
}

/// <summary>Each test gets its own SQLite file so concurrency tests use real database locking.</summary>
public sealed class TestDb : IDisposable
{
    private readonly string _path = Path.Combine(Path.GetTempPath(), $"gise-test-{Guid.NewGuid():N}.db");
    public FakeClock Clock { get; } = new();
    public TicketTokenService Tokens { get; } = new(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Gise:TicketSecret"] = "test-secret" }).Build());

    public TestDb()
    {
        using var db = Context();
        db.Database.Migrate();
    }

    public GiseDbContext Context() => new(new DbContextOptionsBuilder<GiseDbContext>().UseSqlite($"Data Source={_path};Default Timeout=30").Options);
    public TicketingService Service(GiseDbContext db) => new(db, Clock, Tokens, new AuditService(db, Clock));

    public (User attendee, User organizer, Event ev, TicketTier tier) Seed(int capacity = 10, int daysAhead = 10)
    {
        using var db = Context();
        var org = new User { FullName = "Org Kişi", Username = "org" + Guid.NewGuid().ToString("N")[..6], Email = Guid.NewGuid() + "@o.com", Role = UserRole.Organizer, PasswordHash = "x", CreatedAt = Clock.Now };
        var att = new User { FullName = "Elif Kaya", Username = "att" + Guid.NewGuid().ToString("N")[..6], Email = Guid.NewGuid() + "@a.com", Role = UserRole.Attendee, PasswordHash = "x", CreatedAt = Clock.Now };
        var ev = new Event
        {
            Title = "Test Konseri", Category = "Konser", Description = "Açıklama metni yeterince uzun.", Venue = "Sahne", District = "Sarıyer",
            StartsAt = Clock.Now.AddDays(daysAhead), DoorsAt = Clock.Now.AddDays(daysAhead).AddHours(-1), Organizer = org, CreatedAt = Clock.Now,
            Tiers = { new TicketTier { Name = "Tam", Price = 100, Capacity = capacity } }
        };
        db.AddRange(org, att, ev);
        db.SaveChanges();
        return (att, org, ev, ev.Tiers[0]);
    }

    public User NewAttendee()
    {
        using var db = Context();
        var u = new User { FullName = "Kişi " + Guid.NewGuid().ToString("N")[..4], Username = "u" + Guid.NewGuid().ToString("N")[..8], Email = Guid.NewGuid() + "@x.com", Role = UserRole.Attendee, PasswordHash = "x", CreatedAt = Clock.Now };
        db.Users.Add(u); db.SaveChanges();
        return u;
    }

    public int Sold(int tierId) { using var db = Context(); return db.TicketTiers.AsNoTracking().First(t => t.Id == tierId).Sold; }

    public void Dispose()
    {
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        foreach (var f in new[] { _path, _path + "-wal", _path + "-shm" }) if (File.Exists(f)) File.Delete(f);
    }
}

public class TicketingTests
{
    [Fact]
    public async Task Hold_then_pay_issues_one_ticket_per_seat()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed();
        await using var db = t.Context();
        var svc = t.Service(db);

        var hold = await svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 3)]);
        Assert.Equal(OrderStatus.Pending, hold.Status);
        Assert.Equal(300, hold.Total);
        Assert.Equal(3, t.Sold(tier.Id));

        var paid = await svc.PayAsync(att.Id, hold.Code, "4242 4242 4242 4242");
        Assert.Equal(OrderStatus.Confirmed, paid.Status);
        Assert.Equal(3, paid.Tickets.Count);
        Assert.Equal("4242", paid.CardLast4);
        Assert.Equal(3, paid.Tickets.Select(x => x.Code).Distinct().Count());
    }

    [Fact]
    public async Task Last_seat_cannot_be_sold_twice()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed(capacity: 1);
        var other = t.NewAttendee();

        await using (var db = t.Context()) await t.Service(db).HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 1)]);
        await using (var db = t.Context())
        {
            var ex = await Assert.ThrowsAsync<DomainException>(() => t.Service(db).HoldAsync(other.Id, ev.Id, [new HoldLine(tier.Id, 1)]));
            Assert.Equal(409, ex.StatusCode);
            Assert.Contains("tükendi", ex.Message);
        }
        Assert.Equal(1, t.Sold(tier.Id));
    }

    [Fact]
    public async Task Concurrent_buyers_never_overbook()
    {
        using var t = new TestDb();
        var (_, _, ev, tier) = t.Seed(capacity: 5);
        var buyers = Enumerable.Range(0, 12).Select(_ => t.NewAttendee()).ToList();

        var results = await Task.WhenAll(buyers.Select(async u =>
        {
            await using var db = t.Context();
            try { await t.Service(db).HoldAsync(u.Id, ev.Id, [new HoldLine(tier.Id, 1)]); return true; }
            catch (DomainException) { return false; }
        }));

        Assert.Equal(5, results.Count(ok => ok));
        Assert.Equal(5, t.Sold(tier.Id));
    }

    [Fact]
    public async Task Expired_hold_is_released_and_cannot_be_paid()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed();
        string code;
        await using (var db = t.Context()) code = (await t.Service(db).HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 2)])).Code;
        Assert.Equal(2, t.Sold(tier.Id));

        t.Clock.Now = t.Clock.Now.AddMinutes(11);
        await using (var db = t.Context()) Assert.Equal(1, await t.Service(db).ExpireStaleHoldsAsync());
        Assert.Equal(0, t.Sold(tier.Id));

        await using (var db = t.Context())
        {
            var ex = await Assert.ThrowsAsync<DomainException>(() => t.Service(db).PayAsync(att.Id, code, "4242424242424242"));
            Assert.Equal(410, ex.StatusCode);
        }
    }

    [Fact]
    public async Task New_hold_replaces_previous_unpaid_hold()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed();
        await using var db = t.Context();
        var svc = t.Service(db);
        await svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 4)]);
        await svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 1)]);
        Assert.Equal(1, t.Sold(tier.Id));
    }

    [Fact]
    public async Task Per_user_limit_is_six_tickets_per_event()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed(capacity: 50);
        await using var db = t.Context();
        var svc = t.Service(db);
        var hold = await svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 5)]);
        await svc.PayAsync(att.Id, hold.Code, "4242424242424242");

        var ex = await Assert.ThrowsAsync<DomainException>(() => svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 2)]));
        Assert.Equal(409, ex.StatusCode);
        Assert.Contains("5 biletin var", ex.Message);
    }

    [Fact]
    public async Task Banned_user_cannot_hold_tickets()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed();
        await using var db = t.Context();
        var u = await db.Users.FindAsync(att.Id);
        u!.BannedAt = t.Clock.Now; u.BannedUntil = t.Clock.Now.AddDays(7);
        await db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<DomainException>(() => t.Service(db).HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 1)]));
        Assert.Equal(403, ex.StatusCode);
    }

    [Fact]
    public async Task Declined_test_card_returns_402_and_keeps_hold()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed();
        await using var db = t.Context();
        var svc = t.Service(db);
        var hold = await svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 1)]);
        var ex = await Assert.ThrowsAsync<DomainException>(() => svc.PayAsync(att.Id, hold.Code, "4000 0000 0000 0002"));
        Assert.Equal(402, ex.StatusCode);
        Assert.Equal("cardNumber", ex.Field);
        Assert.Equal(1, t.Sold(tier.Id));
    }

    [Fact]
    public async Task Refund_allowed_before_48h_and_blocked_after()
    {
        using var t = new TestDb();
        var (att, _, ev, tier) = t.Seed(daysAhead: 3);
        await using var db = t.Context();
        var svc = t.Service(db);
        var order = await svc.PayAsync(att.Id, (await svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 2)])).Code, "4242424242424242");

        Assert.Equal(100, await svc.CancelTicketAsync(att.Id, order.Tickets[0].Id));
        Assert.Equal(1, t.Sold(tier.Id));

        t.Clock.Now = t.Clock.Now.AddDays(2); // now 24h before the event
        var ex = await Assert.ThrowsAsync<DomainException>(() => svc.CancelTicketAsync(att.Id, order.Tickets[1].Id));
        Assert.Contains("48 saat", ex.Message);
    }

    [Fact]
    public async Task Check_in_accepts_once_and_rejects_forged_or_reused_codes()
    {
        using var t = new TestDb();
        var (att, org, ev, tier) = t.Seed();
        await using var db = t.Context();
        var svc = t.Service(db);
        var order = await svc.PayAsync(att.Id, (await svc.HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 1)])).Code, "4242424242424242");
        var token = t.Tokens.TokenFor(order.Tickets[0].Code);

        var ok = await svc.CheckInAsync(org.Id, false, ev.Id, token);
        Assert.Equal("Elif Kaya", ok.AttendeeName);
        Assert.Equal(1, ok.CheckedIn);

        var reused = await Assert.ThrowsAsync<DomainException>(() => svc.CheckInAsync(org.Id, false, ev.Id, token));
        Assert.Contains("zaten kullanıldı", reused.Message);

        var forged = await Assert.ThrowsAsync<DomainException>(() => svc.CheckInAsync(org.Id, false, ev.Id, $"GISE:{order.Tickets[0].Code}:AAAAAAAAAAAA"));
        Assert.Equal(400, forged.StatusCode);

        var stranger = t.NewAttendee();
        var denied = await Assert.ThrowsAsync<DomainException>(() => svc.CheckInAsync(stranger.Id, false, ev.Id, token));
        Assert.Equal(403, denied.StatusCode);
    }
}

public class EventManagementTests
{
    private sealed class FakeEnv : Microsoft.AspNetCore.Hosting.IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = Path.GetTempPath();
        public Microsoft.Extensions.FileProviders.IFileProvider WebRootFileProvider { get; set; } = new Microsoft.Extensions.FileProviders.NullFileProvider();
        public string ApplicationName { get; set; } = "Gise.Tests";
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = new Microsoft.Extensions.FileProviders.NullFileProvider();
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public string EnvironmentName { get; set; } = "Testing";
    }

    private static EventManagementService Service(TestDb t, GiseDbContext db) => new(db, t.Clock, new AuditService(db, t.Clock), new FakeEnv());

    [Fact]
    public async Task Edit_updates_fields_and_rejects_capacity_below_sold()
    {
        using var t = new TestDb();
        var (att, org, ev, tier) = t.Seed(capacity: 10);
        await using (var db = t.Context()) await t.Service(db).HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 4)]);

        await using (var db = t.Context())
        {
            var svc = Service(t, db);
            var form = EventManagementService.ToForm(await svc.GetEditableAsync(org.Id, false, ev.Id));
            form.Title = "Yeni Başlık";
            form.Tiers[0].Capacity = 3;
            var ex = await Assert.ThrowsAsync<DomainException>(() => svc.UpdateAsync(org.Id, false, ev.Id, form, null));
            Assert.Contains("(4)", ex.Message);
        }
        await using (var db = t.Context())
        {
            var svc = Service(t, db);
            var form = EventManagementService.ToForm(await svc.GetEditableAsync(org.Id, false, ev.Id));
            form.Title = "Yeni Başlık";
            form.Tiers[0].Capacity = 20;
            form.Tiers.Add(new() { Name = "VIP", Price = 300, Capacity = 5 });
            await svc.UpdateAsync(org.Id, false, ev.Id, form, null);
        }
        await using (var db = t.Context())
        {
            var saved = await db.Events.Include(e => e.Tiers).FirstAsync(e => e.Id == ev.Id);
            Assert.Equal("Yeni Başlık", saved.Title);
            Assert.Equal(20, saved.Tiers.First(x => x.Id == tier.Id).Capacity);
            Assert.Equal(2, saved.Tiers.Count);
        }
    }

    [Fact]
    public async Task Other_organizers_cannot_edit_or_delete()
    {
        using var t = new TestDb();
        var (_, _, ev, _) = t.Seed();
        var stranger = t.NewAttendee();
        await using var db = t.Context();
        var svc = Service(t, db);
        Assert.Equal(403, (await Assert.ThrowsAsync<DomainException>(() => svc.GetEditableAsync(stranger.Id, false, ev.Id))).StatusCode);
        Assert.Equal(403, (await Assert.ThrowsAsync<DomainException>(() => svc.DeleteAsync(stranger.Id, false, ev.Id))).StatusCode);
    }

    [Fact]
    public async Task Delete_is_blocked_after_sales_and_allowed_without()
    {
        using var t = new TestDb();
        var (att, org, ev, tier) = t.Seed();
        await using (var db = t.Context()) await t.Service(db).HoldAsync(att.Id, ev.Id, [new HoldLine(tier.Id, 1)]);
        await using (var db = t.Context())
        {
            var ex = await Assert.ThrowsAsync<DomainException>(() => Service(t, db).DeleteAsync(org.Id, false, ev.Id));
            Assert.Equal(409, ex.StatusCode);
        }

        t.Clock.Now = t.Clock.Now.AddMinutes(11); // hold expires → no sales left
        await using (var db = t.Context()) await t.Service(db).ExpireStaleHoldsAsync();
        await using (var db = t.Context()) await Service(t, db).DeleteAsync(org.Id, false, ev.Id);
        await using (var db = t.Context())
        {
            Assert.False(await db.Events.AnyAsync(e => e.Id == ev.Id));
            Assert.False(await db.TicketTiers.AnyAsync(x => x.EventId == ev.Id));
            Assert.Contains(await db.AuditLogs.Select(a => a.Action).ToListAsync(), a => a == "event.delete");
        }
    }
}
