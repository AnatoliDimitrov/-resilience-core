namespace backend.Models;

public record Incident
  {
      public required Guid Id { get; init; }
      public required string Type { get; init; }              // "earthquake"
      public required string Location { get; init; }          // "София, район Лозенец"
      public required string InitialReport { get; init; }     // operator's first description
      public string? Casualties { get; init; }
      public string? BlockedRoutes { get; init; }
      public string? AvailableResources { get; init; }
      public string? MissingResources { get; init; }
      public string? Urgency { get; init; }
      public string? Notes { get; init; }
      public required DateTime CreatedAt { get; init; }
      public List<Update> Updates { get; init; } = new();
      public List<Analysis> Analyses { get; init; } = new();

      // Runtime-only auto-reassessment state (not persisted)
      public DateTime LastOperatorActivityAt { get; set; } = DateTime.UtcNow;
      public DateTime? LastAutoReassessmentAt { get; set; }
      public int AutoReassessmentCount { get; set; }
      public bool AutoReassessmentEnabled { get; set; } = true;
  }
