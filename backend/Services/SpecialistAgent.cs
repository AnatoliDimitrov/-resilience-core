using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Models;

namespace backend.Services;

public class SpecialistAgent
{
    private readonly GeminiClient _gemini;
    private readonly KnowledgeBase _kb;

    public SpecialistAgent(GeminiClient gemini, KnowledgeBase kb)
    {
        _gemini = gemini;
        _kb = kb;
    }

    private string BuildSystemPrompt() => $$"""
          Ти си Специалистки агент в ResilienceCore Field — експерт по реагиране при земетресения.
          Получаваш ситуационно резюме и установени факти. Произвеждаш приоритети и препоръки,
          основани на предоставените инструкции, контакти и ресурси — НЕ на общо знание.

          Правила:
          - Отговаряй САМО с валиден JSON, без markdown.
          - summary: кратък и конкретен отговор към оператора (1–2 изречения). Потвърди какво ново си записал/а от последния вход и какво си променил/а в оценката (фокус, приоритет, план). НЕ повтаряй приоритетите, фактите или препоръките — те се показват отделно в UI-а.
          - urgency ∈ {"critical","high","medium","low"}.
          - responsible: реален екип/служба от предоставените контакти/ресурси, или null.
          - priorities подредени по важност (най-важният пръв).

          Формат:
          {
            "summary": "...",
            "priorities": [{"label":"...","rationale":"...","urgency":"..."}],
            "recommendations": [{"action":"...","rationale":"...","responsible":"..."}]
          }

          --- ИНСТРУКЦИИ ЗА ЗЕМЕТРЕСЕНИЯ ---
          {{_kb.EarthquakeInstructions}}

          --- ЕКСТРЕНИ КОНТАКТИ (JSON) ---
          {{_kb.EmergencyContactsJson}}

          --- НАЛИЧНИ РЕСУРСИ (JSON) ---
          {{_kb.AvailableResourcesJson}}
          """;

    public async Task<SpecialistResult> AnalyzeAsync(SituationalResult situational, string incidentType, CancellationToken ct)
    {
        var userPrompt = $$"""
              Тип инцидент: {{incidentType}}

              Ситуационно резюме: {{situational.SituationalSummary}}

              Установени факти:
              {{string.Join("\n", situational.KnownFacts.Select(f => "- " + f))}}

              Неизвестни:
              {{string.Join("\n", situational.Unknowns.Select(u => "- " + u))}}

              Изготви приоритети и препоръки.
              """;

        var json = await _gemini.GenerateAsync(userPrompt, BuildSystemPrompt(), jsonMode: true, ct);
        return JsonSerializer.Deserialize<SpecialistResult>(json, JsonOpts.Default)
               ?? throw new InvalidOperationException("Specialist agent returned empty JSON");
    }
}

public record SpecialistResult
{
    [JsonPropertyName("summary")] public string Summary { get; init; } = "";
    [JsonPropertyName("priorities")] public List<Priority> Priorities { get; init; } = new();
    [JsonPropertyName("recommendations")] public List<Recommendation> Recommendations { get; init; } = new();
}