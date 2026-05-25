namespace backend.Services;

public class KnowledgeBase
{
    public string EarthquakeInstructions { get; }
    public string EmergencyContactsJson { get; }
    public string AvailableResourcesJson { get; }
    public string ReportTemplate { get; }
    public string SofiaScenarioJson { get; }

    public KnowledgeBase(IWebHostEnvironment env, ILogger<KnowledgeBase> log)
    {
        var dir = Path.Combine(env.ContentRootPath, "KnowledgeBase");
        EarthquakeInstructions = File.ReadAllText(Path.Combine(dir, "earthquake_instructions.md"));
        EmergencyContactsJson = File.ReadAllText(Path.Combine(dir, "emergency_contacts.json"));
        AvailableResourcesJson = File.ReadAllText(Path.Combine(dir, "available_resources.json"));
        ReportTemplate = File.ReadAllText(Path.Combine(dir, "report_template.md"));
        SofiaScenarioJson = File.ReadAllText(Path.Combine(dir, "scenario_sofia_earthquake.json"));

        log.LogInformation(
            "KnowledgeBase loaded from {Dir}: {InstructionsChars} chars instructions, {ContactsChars} chars contacts",
            dir, EarthquakeInstructions.Length, EmergencyContactsJson.Length);
    }
}