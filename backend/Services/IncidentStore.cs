 using System.Collections.Concurrent;
  using backend.Models;

  namespace backend.Services;

  public class IncidentStore
  {
      private readonly ConcurrentDictionary<Guid, Incident> _byId = new();

      public void Save(Incident incident) => _byId[incident.Id] = incident;
      public Incident? Get(Guid id) => _byId.TryGetValue(id, out var i) ? i : null;
      public IEnumerable<Incident> All() => _byId.Values;
  }