using System.Net.Http.Json;
  using System.Text.Json;
  using System.Text.Json.Serialization;

  namespace backend.Services;

  public class GeminiClient
  {
      private readonly HttpClient _http;
      private readonly string _apiKey;
      private readonly string _model;
      private readonly ILogger<GeminiClient> _log;

      private static readonly JsonSerializerOptions JsonOpts = new()
      {
          DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
      };

      public GeminiClient(HttpClient http, IConfiguration config, ILogger<GeminiClient> log)
      {
          _http = http;
          _http.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
          _apiKey = config["Gemini:ApiKey"]
                    ?? throw new InvalidOperationException(
                        "Gemini:ApiKey is not configured. " +
                        "Set via user-secrets locally or env var Gemini__ApiKey in production.");
          _model = config["Gemini:Model"] ?? "gemini-2.5-pro";
          _log = log;
      }

      public async Task<string> GenerateAsync(
          string userPrompt,
          string? systemPrompt = null,
          bool jsonMode = false,
          CancellationToken ct = default)
      {
          var body = new GeminiRequest
          {
              SystemInstruction = systemPrompt is null
                  ? null
                  : new ContentDto { Parts = [new PartDto { Text = systemPrompt }] },
              Contents =
              [
                  new ContentDto { Role = "user", Parts = [new PartDto { Text = userPrompt }] }
              ],
              GenerationConfig = new GenerationConfigDto
              {
                  Temperature = 0.4,
                  ResponseMimeType = jsonMode ? "application/json" : null
              }
          };

          var url = $"v1beta/models/{_model}:generateContent?key={_apiKey}";
          _log.LogInformation("Gemini request → {Model}, prompt {Length} chars, jsonMode={JsonMode}",
              _model, userPrompt.Length, jsonMode);

          var resp = await _http.PostAsJsonAsync(url, body, JsonOpts, ct);

          if (!resp.IsSuccessStatusCode)
          {
              var err = await resp.Content.ReadAsStringAsync(ct);
              _log.LogError("Gemini error {Status}: {Body}", resp.StatusCode, err);
              throw new HttpRequestException($"Gemini API {resp.StatusCode}: {err}");
          }

          var result = await resp.Content.ReadFromJsonAsync<GeminiResponse>(JsonOpts, ct);
          var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

          if (string.IsNullOrWhiteSpace(text))
              throw new InvalidOperationException("Gemini returned empty response.");

          return text;
      }

      public async Task<bool> PingAsync(CancellationToken ct = default)
      {
          try
          {
              var url = $"v1beta/models/{_model}?key={_apiKey}";
              var resp = await _http.GetAsync(url, ct);
              return resp.IsSuccessStatusCode;
          }
          catch
          {
              return false;
          }
      }

      // ---- request/response DTOs (kept private to the class) ----

      private record GeminiRequest
      {
          [JsonPropertyName("systemInstruction")] public ContentDto? SystemInstruction { get; init; }
          [JsonPropertyName("contents")]          public List<ContentDto>? Contents { get; init; }
          [JsonPropertyName("generationConfig")]  public GenerationConfigDto? GenerationConfig { get; init; }
      }

      private record ContentDto
      {
          [JsonPropertyName("role")]  public string? Role { get; init; }
          [JsonPropertyName("parts")] public List<PartDto>? Parts { get; init; }
      }

      private record PartDto
      {
          [JsonPropertyName("text")] public string? Text { get; init; }
      }

      private record GenerationConfigDto
      {
          [JsonPropertyName("temperature")]      public double? Temperature { get; init; }
          [JsonPropertyName("responseMimeType")] public string? ResponseMimeType { get; init; }
      }

      private record GeminiResponse
      {
          [JsonPropertyName("candidates")] public List<Candidate>? Candidates { get; init; }
      }

      private record Candidate
      {
          [JsonPropertyName("content")] public ContentDto? Content { get; init; }
      }
  }