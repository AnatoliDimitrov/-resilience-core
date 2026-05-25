namespace backend.Models;

  public record Analysis
  {
      public required Guid Id { get; init; }
      public required DateTime CreatedAt { get; init; }
      public required string Summary { get; init; }
      public List<Priority> Priorities { get; init; } = new();
      public List<Recommendation> Recommendations { get; init; } = new();
      public List<string> ClarifyingQuestions { get; init; } = new();
      public List<string> KnownFacts { get; init; } = new();
      public List<string> Unknowns { get; init; } = new();
  }