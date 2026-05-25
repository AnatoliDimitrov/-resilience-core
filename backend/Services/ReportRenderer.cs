using System.Globalization;
using System.Text;
using backend.Models;

namespace backend.Services;

public class ReportRenderer
{
    private readonly KnowledgeBase _kb;

    public ReportRenderer(KnowledgeBase kb) => _kb = kb;

    public string Render(Incident incident)
    {
        var latest = incident.Analyses.LastOrDefault();
        var bg = CultureInfo.GetCultureInfo("bg-BG");

        var timeline = new StringBuilder();
        timeline.AppendLine($"- **{incident.CreatedAt.ToLocalTime().ToString("dd.MM.yyyy HH:mm", bg)}** — Първоначален сигнал: {incident.InitialReport}");
        foreach (var u in incident.Updates)
            timeline.AppendLine($"- **{u.Timestamp.ToLocalTime().ToString("dd.MM.yyyy HH:mm", bg)}** — Оператор: {u.Text}");
        foreach (var a in incident.Analyses.Where(a => a.TriggeredBy == "auto"))
            timeline.AppendLine($"- **{a.CreatedAt.ToLocalTime().ToString("dd.MM.yyyy HH:mm", bg)}** — _Автоматична преоценка от ИИ_");

        var priorities = latest is null
            ? "_Няма приоритети._"
            : string.Join("\n", latest.Priorities.Select((p, i) =>
                $"{i + 1}. **[{Urgency(p.Urgency)}] {p.Label}** — {p.Rationale}"));

        var recommendations = latest is null
            ? "_Няма препоръки._"
            : string.Join("\n", latest.Recommendations.Select(r =>
                $"- **{r.Action}** — {r.Rationale}" + (string.IsNullOrWhiteSpace(r.Responsible) ? "" : $" _(отговорен: {r.Responsible})_")));

        var questions = latest is null || latest.ClarifyingQuestions.Count == 0
            ? "_Няма отворени въпроси._"
            : string.Join("\n", latest.ClarifyingQuestions.Select(q => $"- {q}"));

        return _kb.ReportTemplate
            .Replace("{{type}}", TypeLabel(incident.Type))
            .Replace("{{location}}", incident.Location)
            .Replace("{{incident_id}}", incident.Id.ToString())
            .Replace("{{generated_at}}", DateTime.UtcNow.ToLocalTime().ToString("dd.MM.yyyy HH:mm", bg))
            .Replace("{{summary}}", latest?.Summary ?? "_Няма обобщение._")
            .Replace("{{timeline}}", timeline.ToString().TrimEnd())
            .Replace("{{priorities}}", priorities)
            .Replace("{{recommendations}}", recommendations)
            .Replace("{{questions}}", questions);
    }

    private static string Urgency(string u) => u switch
    {
        "critical" => "Критичен",
        "high" => "Висок",
        "medium" => "Среден",
        "low" => "Нисък",
        _ => u
    };

    private static string TypeLabel(string t) => t switch
    {
        "earthquake" => "Земетресение",
        _ => t
    };
}
