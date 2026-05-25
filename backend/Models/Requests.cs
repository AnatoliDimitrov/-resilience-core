  namespace backend.Models;

  public record CreateIncidentRequest
  {
      public required string Type { get; init; }
      public required string Location { get; init; }
      public required string InitialReport { get; init; }
  }

  public record AppendUpdateRequest
  {
      public required string Text { get; init; }
  }