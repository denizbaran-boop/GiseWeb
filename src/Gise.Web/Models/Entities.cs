using System.ComponentModel.DataAnnotations;

namespace Gise.Web.Models;

public enum UserRole { Attendee = 0, Organizer = 1, Admin = 2 }
public enum EventStatus { Draft = 0, Published = 1, Unpublished = 2 }
public enum OrderStatus { Pending = 0, Confirmed = 1, Cancelled = 2, Expired = 3 }
public enum TicketStatus { Issued = 0, Redeemed = 1, Cancelled = 2 }

public class User
{
    public int Id { get; set; }
    [MaxLength(80)] public string FullName { get; set; } = "";
    [MaxLength(20)] public string Username { get; set; } = "";
    [MaxLength(120)] public string Email { get; set; } = "";
    [MaxLength(100)] public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
    [MaxLength(80)] public string? OrganizationName { get; set; }
    public bool RemindersEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    // Ban state: BannedAt set + BannedUntil null => permanent ban.
    public DateTime? BannedAt { get; set; }
    public DateTime? BannedUntil { get; set; }
    [MaxLength(60)] public string? BanReason { get; set; }
    [MaxLength(300)] public string? BanNote { get; set; }

    public List<Order> Orders { get; set; } = new();
    public List<Event> Events { get; set; } = new();

    public bool IsBanned(DateTime now) => BannedAt != null && (BannedUntil == null || BannedUntil > now);
}

public class Event
{
    public int Id { get; set; }
    [MaxLength(60)] public string Title { get; set; } = "";
    [MaxLength(20)] public string Category { get; set; } = "";
    [MaxLength(2000)] public string Description { get; set; } = "";
    [MaxLength(200)] public string? Tags { get; set; }
    [MaxLength(80)] public string Venue { get; set; } = "";
    [MaxLength(40)] public string District { get; set; } = "";
    [MaxLength(40)] public string City { get; set; } = "İstanbul";
    public DateTime StartsAt { get; set; }
    public DateTime DoorsAt { get; set; }
    [MaxLength(20)] public string AgeLimit { get; set; } = "Herkes";
    [MaxLength(200)] public string CoverImage { get; set; } = "/img/covers/1.jpg";
    public EventStatus Status { get; set; } = EventStatus.Published;
    public DateTime CreatedAt { get; set; }

    public int OrganizerId { get; set; }
    public User? Organizer { get; set; }
    public List<TicketTier> Tiers { get; set; } = new();
}

public class TicketTier
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    [MaxLength(30)] public string Name { get; set; } = "";
    [MaxLength(80)] public string? Description { get; set; }
    /// <summary>Price in whole Turkish lira (service fee included).</summary>
    public int Price { get; set; }
    public int Capacity { get; set; }
    /// <summary>Seats taken by confirmed tickets and live (pending) holds.</summary>
    public int Sold { get; set; }
    public int SortOrder { get; set; }

    public int Available => Math.Max(0, Capacity - Sold);
}

public class Order
{
    public int Id { get; set; }
    [MaxLength(12)] public string Code { get; set; } = "";
    public int UserId { get; set; }
    public User? User { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }
    public OrderStatus Status { get; set; }
    public int Total { get; set; }
    public DateTime CreatedAt { get; set; }
    /// <summary>When a pending hold is released if not paid.</summary>
    public DateTime? ExpiresAt { get; set; }
    public DateTime? PaidAt { get; set; }
    [MaxLength(4)] public string? CardLast4 { get; set; }

    public List<OrderItem> Items { get; set; } = new();
    public List<Ticket> Tickets { get; set; } = new();
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int TierId { get; set; }
    public TicketTier? Tier { get; set; }
    public int Quantity { get; set; }
    public int UnitPrice { get; set; }
}

public class Ticket
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int TierId { get; set; }
    public TicketTier? Tier { get; set; }
    [MaxLength(14)] public string Code { get; set; } = "";
    public TicketStatus Status { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public class AuditLog
{
    public int Id { get; set; }
    public int? ActorId { get; set; }
    [MaxLength(80)] public string ActorName { get; set; } = "";
    [MaxLength(40)] public string Action { get; set; } = "";
    [MaxLength(300)] public string Detail { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
