using System.Collections.Concurrent;
using backend.Models;
using backend.Persistence;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public record IncidentSummary(Guid Id, string Type, string Location, DateTime CreatedAt);

public class IncidentStore
{
    private readonly ConcurrentDictionary<Guid, Incident> _byId = new();
    private readonly IDbContextFactory<AppDbContext> _factory;

    public IncidentStore(IDbContextFactory<AppDbContext> factory) => _factory = factory;

    public void Save(Incident incident) => _byId[incident.Id] = incident;
    public Incident? Get(Guid id) => _byId.TryGetValue(id, out var i) ? i : null;
    public IEnumerable<Incident> All() => _byId.Values;

    public async Task PersistAsync(Incident incident, CancellationToken ct = default)
    {
        await using var db = await _factory.CreateDbContextAsync(ct);
        var exists = await db.Incidents.AnyAsync(i => i.Id == incident.Id, ct);
        if (exists) return;
        db.Incidents.Add(new IncidentRow
        {
            Id = incident.Id,
            Type = incident.Type,
            Location = incident.Location,
            InitialReport = incident.InitialReport,
            CreatedAt = incident.CreatedAt
        });
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<IncidentSummary>> ListAsync(CancellationToken ct = default)
    {
        await using var db = await _factory.CreateDbContextAsync(ct);
        return await db.Incidents
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new IncidentSummary(i.Id, i.Type, i.Location, i.CreatedAt))
            .ToListAsync(ct);
    }
}
