using Microsoft.EntityFrameworkCore;

namespace backend.Persistence;

public class IncidentRow
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "";
    public string Location { get; set; } = "";
    public string InitialReport { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<IncidentRow> Incidents => Set<IncidentRow>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<IncidentRow>(e =>
        {
            e.ToTable("Incidents");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(64);
            e.Property(x => x.Location).HasMaxLength(256);
            e.HasIndex(x => x.CreatedAt);
        });
    }
}
