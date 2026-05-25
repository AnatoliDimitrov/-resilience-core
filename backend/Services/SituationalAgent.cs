using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Models;

namespace backend.Services;

public class SituationalAgent
{
    private readonly GeminiClient _gemini;

    public SituationalAgent(GeminiClient gemini) => _gemini = gemini;

    private const string SystemPrompt = """
          Ти си Ситуационен агент в система за координация на бедствени ситуации (ResilienceCore Field).
          Задача: от свободния текст на оператора извличаш структурирани факти за инцидента,
          разграничаваш сигурно от несигурно и формулираш конкретни уточняващи въпроси.

          Правила:
          - Отговаряй САМО с валиден JSON, без markdown, без обяснения извън JSON.
          - Не измисляй факти. Ако нещо не е казано, не го включвай в knownFacts.
          - knownFacts: кратки твърдения, всяко самостоятелно.
          - unknowns: важни параметри, които НЕ са споменати (брой пострадали, точно местоположение, пожари, достъп).
          - clarifyingQuestions: само въпроси, които остават БЕЗ отговор след последния вход на оператора.
            Премахни всеки въпрос, чийто отговор вече е в knownFacts или е изведен от последното съобщение.
            Не повтаряй въпрос, който току-що е получил отговор. Подреди по важност (най-критичният първи).
            Кратки, директни — за радиостанция.

          Формат:
          {
            "situationalSummary": "1-2 изречения",
            "knownFacts": ["..."],
            "unknowns": ["..."],
            "clarifyingQuestions": ["..."]
          }
          """;

    public async Task<SituationalResult> AnalyzeAsync(string operatorReport, IEnumerable<Update> history, CancellationToken ct)
    {
        var historyBlock = history.Any()
            ? "\n\nИстория на обновленията:\n" + string.Join("\n", history.Select(u => $"- [{u.Timestamp:HH:mm}] {u.Text}"))
            : "";

        var userPrompt = $"Доклад от оператор:\n{operatorReport}{historyBlock}";

        var json = await _gemini.GenerateAsync(userPrompt, SystemPrompt, jsonMode: true, ct);
        return JsonSerializer.Deserialize<SituationalResult>(json, JsonOpts.Default)
         ?? throw new InvalidOperationException("Situational agent returned empty JSON");
    }
}

public record SituationalResult
{
    [JsonPropertyName("situationalSummary")] public string SituationalSummary { get; init; } = "";
    [JsonPropertyName("knownFacts")] public List<string> KnownFacts { get; init; } = new();
    [JsonPropertyName("unknowns")] public List<string> Unknowns { get; init; } = new();
    [JsonPropertyName("clarifyingQuestions")] public List<string> ClarifyingQuestions { get; init; } = new();
}