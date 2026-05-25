namespace backend.Models;

  public record Priority
  {
      public required string Label { get; init; }
      public required string Rationale { get; init; }
      public required string Urgency { get; init; } // critical | high | medium | low
  }