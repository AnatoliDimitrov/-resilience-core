using backend.Models;
using backend.Services;

namespace backend.BackgroundServices;

public class ReassessmentService : BackgroundService
{
    private static readonly TimeSpan TickInterval = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan SilenceThreshold = TimeSpan.FromSeconds(60);
    private const int MaxAutoReassessments = 3;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IncidentStore _store;
    private readonly ILogger<ReassessmentService> _log;

    public ReassessmentService(IServiceScopeFactory scopeFactory, IncidentStore store, ILogger<ReassessmentService> log)
    {
        _scopeFactory = scopeFactory;
        _store = store;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _log.LogInformation("ReassessmentService started; tick={Tick}s, silenceThreshold={Silence}s, maxFires={Max}",
            TickInterval.TotalSeconds, SilenceThreshold.TotalSeconds, MaxAutoReassessments);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _log.LogError(ex, "ReassessmentService tick failed");
            }
            try
            {
                await Task.Delay(TickInterval, stoppingToken);
            }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        foreach (var incident in _store.All())
        {
            if (!incident.AutoReassessmentEnabled) continue;
            if (incident.AutoReassessmentCount >= MaxAutoReassessments) continue;

            var lastActivity = incident.LastAutoReassessmentAt > incident.LastOperatorActivityAt
                ? incident.LastAutoReassessmentAt!.Value
                : incident.LastOperatorActivityAt;
            var elapsed = now - lastActivity;
            if (elapsed < SilenceThreshold) continue;

            await ReassessAsync(incident, now - incident.LastOperatorActivityAt, ct);
        }
    }

    private async Task ReassessAsync(Incident incident, TimeSpan silenceFromOperator, CancellationToken ct)
    {
        _log.LogInformation("Auto-reassessing incident {Id} (silence={Silence}s, fire #{N})",
            incident.Id, (int)silenceFromOperator.TotalSeconds, incident.AutoReassessmentCount + 1);

        using var scope = _scopeFactory.CreateScope();
        var situationalAgent = scope.ServiceProvider.GetRequiredService<SituationalAgent>();
        var specialistAgent = scope.ServiceProvider.GetRequiredService<SpecialistAgent>();

        var situational = await situationalAgent.AnalyzeAsync(incident.InitialReport, incident.Updates, ct);
        var specialist = await specialistAgent.AnalyzeAsync(situational, incident.Type, ct, silenceElapsed: silenceFromOperator);

        var analysis = new Analysis
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Summary = specialist.Summary,
            TriggeredBy = "auto",
            Priorities = specialist.Priorities,
            Recommendations = specialist.Recommendations,
            ClarifyingQuestions = situational.ClarifyingQuestions,
            KnownFacts = situational.KnownFacts,
            Unknowns = situational.Unknowns
        };
        incident.Analyses.Add(analysis);
        incident.LastAutoReassessmentAt = DateTime.UtcNow;
        incident.AutoReassessmentCount += 1;
        _store.Save(incident);
    }
}
