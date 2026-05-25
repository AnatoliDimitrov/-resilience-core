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

      // Runtime-only auto-reassessment state (not persisted)
      public DateTime LastOperatorActivityAt { get; set; } = DateTime.UtcNow;
      public DateTime? LastAutoReassessmentAt { get; set; }
      public int AutoReassessmentCount { get; set; }
      public bool AutoReassessmentEnabled { get; set; } = true;
  }
