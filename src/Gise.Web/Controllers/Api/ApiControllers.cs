using Gise.Web.Data;
using Gise.Web.Helpers;
using Gise.Web.Infrastructure;
using Gise.Web.Models;
using Gise.Web.Services;
using Gise.Web.ViewModels;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Controllers.Api;

// All endpoints return JSON. Errors are RFC 7807 ProblemDetails:
//   400 validation (with "errors" per field), 401/403 auth, 404, 409 business conflicts, 410 expired hold.

[ApiController, Route("api/events")]
public class EventsApiController(EventQueryService events, GiseDbContext db) : ControllerBase
{
    /// <summary>FR-02 catalog search: keyword, category, price ceiling, date range, sort.</summary>
    [HttpGet]
    public async Task<IEnumerable<EventDto>> Search([FromQuery] string? q, [FromQuery] string? category, [FromQuery] string? sort,
        [FromQuery] int? maxPrice, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        (await events.SearchAsync(new EventFilter(q, category, sort, maxPrice, from, to), ct)).Select(EventQueryService.ToDto);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventDto>> Get(int id, CancellationToken ct)
    {
        var e = await db.Events.AsNoTracking().Include(x => x.Tiers).Include(x => x.Organizer)
            .FirstOrDefaultAsync(x => x.Id == id && x.Status == EventStatus.Published, ct);
        return e is null ? Problem(title: "Etkinlik bulunamadı.", statusCode: 404) : EventQueryService.ToDto(e);
    }
}

[ApiController, Authorize, Route("api")]
public class OrdersApiController(TicketingService ticketing, IClock clock) : ControllerBase
{
    /// <summary>Step 1 of checkout: hold the selected seats for 10 minutes (FR-04).</summary>
    [HttpPost("orders/hold")]
    public async Task<IActionResult> Hold(HoldRequest req, CancellationToken ct)
    {
        var order = await ticketing.HoldAsync(User.Id(), req.EventId, req.Lines.Select(l => new HoldLine(l.TierId, l.Quantity)), ct);
        return Ok(new
        {
            order.Code, order.Total, ExpiresAt = order.ExpiresAt,
            SecondsLeft = (int)(order.ExpiresAt!.Value - clock.Now).TotalSeconds,
        });
    }

    /// <summary>Step 2: mock payment, then tickets with signed QR codes are issued (FR-05, FR-06).</summary>
    [HttpPost("orders/{code}/pay")]
    public async Task<IActionResult> Pay(string code, PayRequest req, CancellationToken ct)
    {
        var order = await ticketing.PayAsync(User.Id(), code, req.CardNumber, ct);
        return Ok(new { order.Code, Tickets = order.Tickets.Count, Redirect = $"/bilet/{order.Code}" });
    }

    /// <summary>Closing the checkout sheet releases the hold right away.</summary>
    [HttpDelete("orders/{code}")]
    public async Task<IActionResult> Release(string code, CancellationToken ct)
    {
        await ticketing.CancelHoldAsync(User.Id(), code, ct);
        return NoContent();
    }

    [HttpPost("tickets/{id:int}/cancel")]
    public async Task<IActionResult> CancelTicket(int id, CancellationToken ct)
    {
        var refund = await ticketing.CancelTicketAsync(User.Id(), id, ct);
        return Ok(new { Refund = refund, Message = $"Bilet iptal edildi; {Ui.Tl(refund)} kartına iade edilecek." });
    }
}

[ApiController, Authorize, Route("api/account")]
public class AccountApiController(GiseDbContext db, AuditService audit) : ControllerBase
{
    [AllowAnonymous, HttpGet("username-available")]
    public async Task<IActionResult> UsernameAvailable([FromQuery] string username, CancellationToken ct)
    {
        username = (username ?? "").Trim().TrimStart('@');
        if (!System.Text.RegularExpressions.Regex.IsMatch(username, Rules.UsernamePattern))
            return Ok(new { Available = false, Message = Rules.UsernameMessage });
        var me = User.IsSignedIn() ? User.Id() : 0;
        var taken = await db.Users.AnyAsync(u => u.Username == username && u.Id != me, ct);
        return Ok(new { Available = !taken, Message = taken ? $"@{username} alınmış." : $"@{username} kullanılabilir." });
    }

    [HttpPut("username")]
    public async Task<IActionResult> ChangeUsername(ChangeUsernameVm vm, CancellationToken ct)
    {
        var me = await Me(ct);
        var name = vm.Username.Trim();
        if (string.Equals(name, me.Username, StringComparison.OrdinalIgnoreCase) && name == me.Username)
            throw new DomainException("Bu zaten senin kullanıcı adın.", 409, "username");
        if (await db.Users.AnyAsync(u => u.Username == name && u.Id != me.Id, ct))
            throw new DomainException($"@{name} alınmış; başka bir tane dene.", 409, "username");
        var old = me.Username;
        me.Username = name;
        audit.Log(me.Id, me.FullName, "user.username", $"@{old} → @{name}");
        await db.SaveChangesAsync(ct);
        await RefreshCookie(me);
        return Ok(new { me.Username, Previous = old, Message = $"Kullanıcı adın @{name} oldu." });
    }

    [HttpPut("email")]
    public async Task<IActionResult> ChangeEmail(ChangeEmailVm vm, CancellationToken ct)
    {
        var me = await Me(ct);
        if (!Passwords.Verify(vm.CurrentPassword, me.PasswordHash)) throw new DomainException("Şifre hatalı.", 400, "currentPassword");
        var email = vm.Email.Trim();
        if (await db.Users.AnyAsync(u => u.Email == email && u.Id != me.Id, ct)) throw new DomainException("Bu e-posta başka bir hesapta kullanılıyor.", 409, "email");
        me.Email = email;
        audit.Log(me.Id, me.FullName, "user.email", "E-posta adresi değiştirildi");
        await db.SaveChangesAsync(ct);
        return Ok(new { me.Email, Message = $"E-posta adresin {email} olarak güncellendi." });
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordVm vm, CancellationToken ct)
    {
        var me = await Me(ct);
        if (!Passwords.Verify(vm.CurrentPassword, me.PasswordHash)) throw new DomainException("Mevcut şifre hatalı.", 400, "currentPassword");
        if (Passwords.Verify(vm.NewPassword, me.PasswordHash)) throw new DomainException("Yeni şifre eskisiyle aynı olamaz.", 400, "newPassword");
        me.PasswordHash = Passwords.Hash(vm.NewPassword);
        audit.Log(me.Id, me.FullName, "user.password", "Şifre değiştirildi");
        await db.SaveChangesAsync(ct);
        return Ok(new { Message = "Şifren güncellendi." });
    }

    [HttpPut("preferences")]
    public async Task<IActionResult> Preferences(PreferencesVm vm, CancellationToken ct)
    {
        var me = await Me(ct);
        me.RemindersEnabled = vm.RemindersEnabled;
        await db.SaveChangesAsync(ct);
        return Ok(new { me.RemindersEnabled });
    }

    private async Task<User> Me(CancellationToken ct) =>
        await db.Users.FindAsync([User.Id()], ct) ?? throw new DomainException("Oturumun sona ermiş; yeniden giriş yap.", 401);

    private Task RefreshCookie(User u) =>
        HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, u.ToPrincipal(), new AuthenticationProperties { IsPersistent = true });
}

[ApiController, Authorize(Roles = Roles.OrganizerOrAdmin), Route("api/organizer")]
public class OrganizerApiController(GiseDbContext db, TicketingService ticketing, CopywriterService copywriter, EventManagementService events, AuditService audit) : ControllerBase
{
    /// <summary>FR-07: "AI ile yaz" in the create-event form.</summary>
    [HttpPost("copy")]
    public async Task<CopyResult> Copy(CopyRequestVm vm, CancellationToken ct) =>
        await copywriter.WriteAsync(new CopyRequest(vm.Title, vm.Category, vm.Venue, vm.District, vm.Artist), ct);

    [HttpPost("events/{id:int}/status")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] StatusChange body, CancellationToken ct)
    {
        var ev = await db.Events.FindAsync([id], ct) ?? throw new DomainException("Etkinlik bulunamadı.", 404);
        var isAdmin = User.IsInRole(Roles.Admin);
        if (!isAdmin && ev.OrganizerId != User.Id()) throw new DomainException("Bu etkinlik sana ait değil.", 403);
        if (!Enum.TryParse<EventStatus>(body.Status, out var status) || status == EventStatus.Draft)
            throw new DomainException("Geçersiz durum.", 400, "status");
        var old = ev.Status;
        ev.Status = status;
        var me = await db.Users.FindAsync([User.Id()], ct);
        audit.Log(me!.Id, me.FullName, status == EventStatus.Published ? "event.publish" : "event.unpublish", $"#{ev.Id} {ev.Title}{(isAdmin && ev.OrganizerId != me.Id ? " (admin)" : "")}");
        await db.SaveChangesAsync(ct);
        return Ok(new { Status = ev.Status.ToString(), Previous = old.ToString() });
    }

    /// <summary>Deletes an event without sales (the "D" of CRUD for events).</summary>
    [HttpDelete("events/{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await events.DeleteAsync(User.Id(), User.IsInRole(Roles.Admin), id, ct);
        return NoContent();
    }

    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn(CheckInRequest req, CancellationToken ct)
    {
        var r = await ticketing.CheckInAsync(User.Id(), User.IsInRole(Roles.Admin), req.EventId, req.Code, ct);
        return Ok(r);
    }

    [HttpGet("events/{id:int}/checkin-stats")]
    public async Task<IActionResult> CheckInStats(int id, CancellationToken ct)
    {
        var (checkedIn, issued) = await ticketing.CheckInStatsAsync(id, ct);
        return Ok(new { CheckedIn = checkedIn, Issued = issued });
    }

    public record StatusChange(string Status);
}

[ApiController, Authorize(Roles = Roles.Admin), Route("api/admin")]
public class AdminApiController(GiseDbContext db, IClock clock, AuditService audit) : ControllerBase
{
    public record UserRow(int Id, string Name, string Email, string Username, string Role, string RoleLabel, string Joined, int Tickets, bool Banned, string? Until, string? Reason);

    [HttpGet("users")]
    public async Task<IEnumerable<UserRow>> Users([FromQuery] string? q, [FromQuery] string? filter, CancellationToken ct)
    {
        var now = clock.Now;
        var query = db.Users.AsNoTracking();
        query = filter switch
        {
            "Katılımcı" => query.Where(u => u.Role == UserRole.Attendee),
            "Organizatör" => query.Where(u => u.Role == UserRole.Organizer),
            "Banlı" => query.Where(u => u.BannedAt != null && (u.BannedUntil == null || u.BannedUntil > now)),
            _ => query
        };
        var list = await query.OrderBy(u => u.Id).Select(u => new
        {
            User = u,
            Tickets = db.Tickets.Count(t => t.Order!.UserId == u.Id && t.Status != TicketStatus.Cancelled)
        }).ToListAsync(ct);

        var terms = Text.Fold(q).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return list
            .Where(x => terms.Length == 0 || terms.All(Text.Fold($"{x.User.FullName} {x.User.Email} {x.User.Username} {x.User.OrganizationName}").Contains))
            .Select(x => Row(x.User, x.Tickets, now));
    }

    [HttpPost("users/{id:int}/ban")]
    public async Task<IActionResult> Ban(int id, BanRequest req, CancellationToken ct)
    {
        if (!BanRequest.Reasons.Contains(req.Reason)) throw new DomainException("Listeden bir sebep seç.", 400, "reason");
        var (me, target) = await LoadAsync(id, ct);
        if (target.Role == UserRole.Admin) throw new DomainException("Admin hesapları banlanamaz.", 409);
        var now = clock.Now;
        target.BannedAt = now;
        target.BannedUntil = req.Duration == "perm" ? null : now.AddDays(int.Parse(req.Duration));
        target.BanReason = req.Reason;
        target.BanNote = string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim();
        audit.Log(me.Id, me.FullName, "user.ban", $"{target.FullName} · {(req.Duration == "perm" ? "Kalıcı" : req.Duration + " gün")} · {req.Reason}");
        await db.SaveChangesAsync(ct);
        return Ok(Row(target, await TicketCount(id, ct), now));
    }

    [HttpPost("users/{id:int}/unban")]
    public async Task<IActionResult> Unban(int id, CancellationToken ct)
    {
        var (me, target) = await LoadAsync(id, ct);
        target.BannedAt = null; target.BannedUntil = null; target.BanReason = null; target.BanNote = null;
        audit.Log(me.Id, me.FullName, "user.unban", target.FullName);
        await db.SaveChangesAsync(ct);
        return Ok(Row(target, await TicketCount(id, ct), clock.Now));
    }

    private async Task<(User Me, User Target)> LoadAsync(int id, CancellationToken ct)
    {
        var me = await db.Users.FindAsync([User.Id()], ct) ?? throw new DomainException("Oturum bulunamadı.", 401);
        var target = await db.Users.FindAsync([id], ct) ?? throw new DomainException("Kullanıcı bulunamadı.", 404);
        if (target.Id == me.Id) throw new DomainException("Kendi hesabını banlayamazsın.", 409);
        return (me, target);
    }

    private Task<int> TicketCount(int userId, CancellationToken ct) =>
        db.Tickets.CountAsync(t => t.Order!.UserId == userId && t.Status != TicketStatus.Cancelled, ct);

    public static UserRow Row(User u, int tickets, DateTime now) => new(
        u.Id, u.FullName, u.Email, u.Username, u.Role.ToString(), Roles.Label(u.Role), u.CreatedAt.ToString("dd.MM.yyyy"), tickets,
        u.IsBanned(now), u.IsBanned(now) ? (u.BannedUntil is { } d ? d.ToString("dd.MM.yyyy") : "Kalıcı") : null, u.BanReason);
}
