namespace backend.Models;

  public record Recommendation
  {
      public required string Action { get; init; }
      public required string Rationale { get; init; }
      public string? Responsible { get; init; }
  }