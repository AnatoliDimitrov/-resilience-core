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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIncidentRequest req, CancellationToken ct)
    {
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Type = req.Type,
            Location = req.Location,
            InitialReport = req.InitialReport,
            CreatedAt = DateTime.UtcNow
        };

        var situational = await _situational.AnalyzeAsync(incident.InitialReport, incident.Updates, ct);
        var specialist = await _specialist.AnalyzeAsync(situational, incident.Type, ct);

        var analysis = new Analysis
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Summary = specialist.Summary,
            Priorities = specialist.Priorities,
            Recommendations = specialist.Recommendations,
            ClarifyingQuestions = situational.ClarifyingQuestions,
            KnownFacts = situational.KnownFacts,
            Unknowns = situational.Unknowns
        };

        incident.Analyses.Add(analysis);
        _store.Save(incident);

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

        var situational = await _situational.AnalyzeAsync(incident.InitialReport, incident.Updates, ct);
        var specialist = await _specialist.AnalyzeAsync(situational, incident.Type, ct);

        var analysis = new Analysis
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Summary = specialist.Summary,
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

    [HttpGet("{id:guid}")]
    public IActionResult Get(Guid id)
    {
        var inc = _store.Get(id);
        return inc is null ? NotFound() : Ok(inc);
    }
}