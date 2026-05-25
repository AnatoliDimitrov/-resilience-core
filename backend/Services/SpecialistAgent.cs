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
          - summary: радио-съобщение към оператора (5–7 изречения, повелителен тон). Всяко изречение трябва да носи конкретна оперативна информация — назовавай локации, улици, ресурси, екипи, числа и системи от входа; избягвай общи нареждания.
            Структура:
              (1) кратко потвърждение какво си приел от последния вход с поне един конкретен факт (локация, обект, число, ресурс);
              (2) 2–3 директни команди в повелителна форма за това, което трябва да се направи СЕГА ("Незабавно изпрати...", "Поискай от...", "Разпореди...", "Преустанови...", "Не позволявай...") — всяка команда да цитира конкретен адресат, място и, когато е приложимо, последователност или времеви ориентир;
              (3) ЕДНО предупреждение за критичен пропуск, който може да бъде забравен под стрес — назови конкретната опасност и защо още не е адресирана (напр. "газопреносната мрежа още не е проверена — риск от експлозия");
              (4) ЕДНО антиципиращо изречение какво операторът трябва да очаква или провери ПРЕДИ следващото решение ("Очаквай първи екип на ГД ПБЗН до X мин — подготви достъп", "Преди да допуснеш техниката, поискай оценка на конструкцията", "Подготви второ депо за пострадали, ако броят надвиши Y").
            Тон: спокоен, уверен, декларативен. Операторът може да е в паника — ти мислиш ясно вместо него.
            НЕ повтаряй пълния списък с приоритети, факти или препоръки — те се показват отделно в UI-а.
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

    public async Task<SpecialistResult> AnalyzeAsync(SituationalResult situational, string incidentType, CancellationToken ct, TimeSpan? silenceElapsed = null)
    {
        var reassessmentBlock = silenceElapsed.HasValue
            ? $$"""

              АВТОМАТИЧНА ПРЕОЦЕНКА:
              Изминаха {{(int)silenceElapsed.Value.TotalMinutes}} мин и {{silenceElapsed.Value.Seconds}} сек от последния вход на оператора. Без нов вход — НЕ измисляй нови факти.
              Преоцени въз основа на изтеклото време: пренареди приоритети, отбележи какво вероятно е било пропуснато или е изтекло (напр. "екип ГД ПБЗН все още не е потвърден — отново настоявай"), задай нови уточняващи въпроси, ако е уместно.
              В summary започни с "Преоценка след {{(int)silenceElapsed.Value.TotalMinutes}} мин тишина:" и посочи какво се променя поради изтеклото време.
              """
            : "";

        var userPrompt = $$"""
              Тип инцидент: {{incidentType}}

              Ситуационно резюме: {{situational.SituationalSummary}}

              Установени факти:
              {{string.Join("\n", situational.KnownFacts.Select(f => "- " + f))}}

              Неизвестни:
              {{string.Join("\n", situational.Unknowns.Select(u => "- " + u))}}
              {{reassessmentBlock}}
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
