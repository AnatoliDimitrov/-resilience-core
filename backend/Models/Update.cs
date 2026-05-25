namespace backend.Models;

  public record Update
  {
      public required Guid Id { get; init; }
      public required string Text { get; init; }
      public required DateTime Timestamp { get; init; }
  }