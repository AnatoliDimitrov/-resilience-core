namespace backend.Models;

  public record CreateIncidentRequest
  {
      public required string Type { get; init; }
      public required string Location { get; init; }
      public required string InitialReport { get; init; }
      public string? Casualties { get; init; }
      public string? BlockedRoutes { get; init; }
      public string? AvailableResources { get; init; }
      public string? MissingResources { get; init; }
      public string? Urgency { get; init; }
      public string? Notes { get; init; }
  }

  public record AppendUpdateRequest
  {
      public required string Text { get; init; }
  }
