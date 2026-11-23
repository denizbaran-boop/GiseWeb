using Gise.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Data;

public class GiseDbContext(DbContextOptions<GiseDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<TicketTier> TicketTiers => Set<TicketTier>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.Property(u => u.Username).UseCollation("NOCASE");
            e.Property(u => u.Email).UseCollation("NOCASE");
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        b.Entity<Event>(e =>
        {
            e.HasOne(x => x.Organizer).WithMany(u => u.Events).HasForeignKey(x => x.OrganizerId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.Status, x.StartsAt });
            e.HasIndex(x => x.Category);
        });

        b.Entity<TicketTier>(e =>
        {
            e.HasOne(t => t.Event).WithMany(x => x.Tiers).HasForeignKey(t => t.EventId).OnDelete(DeleteBehavior.Cascade);
            e.ToTable(t => t.HasCheckConstraint("CK_Tier_Sold", "Sold >= 0 AND Sold <= Capacity"));
        });

        b.Entity<Order>(e =>
        {
            e.HasIndex(o => o.Code).IsUnique();
            e.HasIndex(o => new { o.Status, o.ExpiresAt });
            e.HasOne(o => o.User).WithMany(u => u.Orders).HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(o => o.Event).WithMany().HasForeignKey(o => o.EventId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<OrderItem>(e =>
        {
            e.HasOne(i => i.Order).WithMany(o => o.Items).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.Tier).WithMany().HasForeignKey(i => i.TierId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Ticket>(e =>
        {
            e.HasIndex(t => t.Code).IsUnique();
            e.HasOne(t => t.Order).WithMany(o => o.Tickets).HasForeignKey(t => t.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(t => t.Tier).WithMany().HasForeignKey(t => t.TierId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<AuditLog>().HasIndex(a => a.CreatedAt);
    }
}
