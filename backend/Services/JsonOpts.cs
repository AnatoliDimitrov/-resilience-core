  using System.Text.Json;

  namespace backend.Services;

  internal static class JsonOpts
  {
      public static readonly JsonSerializerOptions Default = new()
      {
          PropertyNameCaseInsensitive = true
      };
  }