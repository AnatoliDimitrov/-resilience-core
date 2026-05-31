using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly SituationalAgent _situational;
    private readonly SpecialistAgent _specialist;
    private readonly IncidentStore _store;
    private readonly ILogger<IncidentsController> _log;

    public IncidentsController(SituationalAgent s, SpecialistAgent sp, IncidentStore store, ILogger<IncidentsController> log)
    {
        _situational = s; _specialist = sp; _store = store; _log = log;
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var incidents = await _store.ListAsync(ct);
        return Ok(incidents);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIncidentRequest req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Type = req.Type,
            Location = req.Location,
            InitialReport = req.InitialReport,
            Casualties = req.Casualties,
            BlockedRoutes = req.BlockedRoutes,
            AvailableResources = req.AvailableResources,
            MissingResources = req.MissingResources,
            Urgency = req.Urgency,
            Notes = req.Notes,
            CreatedAt = now,
            LastOperatorActivityAt = now,
            AutoReassessmentEnabled = true
        };

        var fullReport = BuildFullReport(incident);
        var situational = await _situational.AnalyzeAsync(fullReport, incident.Updates, ct);
        var specialist = await _specialist.AnalyzeAsync(situational, incident.Type, ct);

        var analysis = new Analysis
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Summary = specialist.Summary,
            TriggeredBy = "operator",
            Priorities = specialist.Priorities,
            Recommendations = specialist.Recommendations,
            ClarifyingQuestions = situational.ClarifyingQuestions,
            KnownFacts = situational.KnownFacts,
            Unknowns = situational.Unknowns
        };

        incident.Analyses.Add(analysis);
        _store.Save(incident);
        await _store.PersistAsync(incident, ct);

        _log.LogInformation("Incident {Id} created with {Priorities} priorities, {Recs} recommendations",
            incident.Id, analysis.Priorities.Count, analysis.Recommendations.Count);

        return Ok(new { incident, analysis });
    }

    [HttpPost("{id:guid}/updates")]
    public async Task<IActionResult> AppendUpdate(Guid id, [FromBody] AppendUpdateRequest req, CancellationToken ct)
    {
        var incident = _store.Get(id);
        if (incident is null) return NotFound();

        var update = new Update
        {
            Id = Guid.NewGuid(),
            Text = req.Text,
            Timestamp = DateTime.UtcNow
        };
        incident.Updates.Add(update);
        incident.LastOperatorActivityAt = DateTime.UtcNow;
        incident.AutoReassessmentCount = 0;

        var situational = await _situational.AnalyzeAsync(incident.InitialReport, incident.Updates, ct);
        var specialist = await _specialist.AnalyzeAsync(situational, incident.Type, ct);

        var analysis = new Analysis
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Summary = specialist.Summary,
            TriggeredBy = "operator",
            Priorities = specialist.Priorities,
            Recommendations = specialist.Recommendations,
            ClarifyingQuestions = situational.ClarifyingQuestions,
            KnownFacts = situational.KnownFacts,
            Unknowns = situational.Unknowns
        };
        incident.Analyses.Add(analysis);
        _store.Save(incident);

        _log.LogInformation("Update appended to {Id}; total updates={Count}", incident.Id, incident.Updates.Count);

        return Ok(new { incident, analysis });
    }

    [HttpPatch("{id:guid}/auto-reassessment")]
    public IActionResult SetAutoReassessment(Guid id, [FromBody] AutoReassessmentRequest req)
    {
        var incident = _store.Get(id);
        if (incident is null) return NotFound();
        incident.AutoReassessmentEnabled = req.Enabled;
        if (req.Enabled)
        {
            incident.LastOperatorActivityAt = DateTime.UtcNow;
            incident.AutoReassessmentCount = 0;
        }
        _log.LogInformation("Incident {Id} auto-reassessment set to {Enabled}", id, req.Enabled);
        return Ok(new { enabled = incident.AutoReassessmentEnabled });
    }

    [HttpGet("{id:guid}")]
    public IActionResult Get(Guid id)
    {
        var inc = _store.Get(id);
        return inc is null ? NotFound() : Ok(inc);
    }

    private static string BuildFullReport(Incident inc)
    {
        var parts = new List<string> { inc.InitialReport };
        if (!string.IsNullOrWhiteSpace(inc.Casualties)) parts.Add("Пострадали: " + inc.Casualties);
        if (!string.IsNullOrWhiteSpace(inc.BlockedRoutes)) parts.Add("Блокирани маршрути: " + inc.BlockedRoutes);
        if (!string.IsNullOrWhiteSpace(inc.AvailableResources)) parts.Add("Налични ресурси: " + inc.AvailableResources);
        if (!string.IsNullOrWhiteSpace(inc.MissingResources)) parts.Add("Липсващи ресурси: " + inc.MissingResources);
        if (!string.IsNullOrWhiteSpace(inc.Urgency)) parts.Add("Ниво на спешност: " + inc.Urgency);
        if (!string.IsNullOrWhiteSpace(inc.Notes)) parts.Add("Допълнителни бележки: " + inc.Notes);
        return string.Join("\n", parts);
    }
}

public record AutoReassessmentRequest(bool Enabled);
