namespace backend.Models;

public record Incident
  {
      public required Guid Id { get; init; }
      public required string Type { get; init; }              // "earthquake"
      public required string Location { get; init; }          // "София, район Лозенец"
      public required string InitialReport { get; init; }     // operator's first description
      public required DateTime CreatedAt { get; init; }
      public List<Update> Updates { get; init; } = new();
      public List<Analysis> Analyses { get; init; } = new();
  }