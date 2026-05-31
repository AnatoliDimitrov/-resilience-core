using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Services;

public class GeminiClient
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string[] _models;
    private readonly ILogger<GeminiClient> _log;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly int[] RetriableStatusCodes = [429, 503, 500];

    public GeminiClient(HttpClient http, IConfiguration config, ILogger<GeminiClient> log)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
        _apiKey = config["Gemini:ApiKey"]
                  ?? throw new InvalidOperationException(
                      "Gemini:ApiKey is not configured. " +
                      "Set via user-secrets locally or env var Gemini__ApiKey in production.");

        var primary = config["Gemini:Model"] ?? "gemini-2.5-pro";
        var fallbacks = config.GetSection("Gemini:Fallbacks").Get<string[]>()
                        ?? ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
        _models = [primary, ..fallbacks];

        _log = log;
        _log.LogInformation("Gemini models configured: {Models}", string.Join(" → ", _models));
    }

    public string PrimaryModel => _models[0];
    public string? LastUsedModel { get; private set; }

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

        HttpRequestException? lastException = null;

        for (var i = 0; i < _models.Length; i++)
        {
            var model = _models[i];
            var url = $"v1beta/models/{model}:generateContent?key={_apiKey}";

            _log.LogInformation("Gemini request → {Model} ({Attempt}/{Total}), prompt {Length} chars, jsonMode={JsonMode}",
                model, i + 1, _models.Length, userPrompt.Length, jsonMode);

            HttpResponseMessage resp;
            try
            {
                resp = await _http.PostAsJsonAsync(url, body, JsonOpts, ct);
            }
            catch (TaskCanceledException) when (!ct.IsCancellationRequested)
            {
                _log.LogWarning("Gemini timeout on {Model}, falling back", model);
                lastException = new HttpRequestException($"Gemini API timeout on {model}");
                continue;
            }

            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync(ct);
                var status = (int)resp.StatusCode;

                if (RetriableStatusCodes.Contains(status) && i < _models.Length - 1)
                {
                    _log.LogWarning("Gemini {Status} on {Model}, falling back to next model. Error: {Err}",
                        status, model, err.Length > 200 ? err[..200] : err);
                    lastException = new HttpRequestException($"Gemini API {resp.StatusCode}: {err}");
                    continue;
                }

                _log.LogError("Gemini error {Status} on {Model}: {Body}", resp.StatusCode, model, err);
                throw new HttpRequestException($"Gemini API {resp.StatusCode}: {err}");
            }

            var result = await resp.Content.ReadFromJsonAsync<GeminiResponse>(JsonOpts, ct);
            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(text))
                throw new InvalidOperationException($"Gemini ({model}) returned empty response.");

            LastUsedModel = model;

            if (i > 0)
                _log.LogInformation("Gemini fallback succeeded on {Model} (primary {Primary} was unavailable)",
                    model, _models[0]);

            return text;
        }

        throw lastException ?? new HttpRequestException("All Gemini models failed.");
    }

    public async Task<bool> PingAsync(CancellationToken ct = default)
    {
        try
        {
            var url = $"v1beta/models/{_models[0]}?key={_apiKey}";
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
