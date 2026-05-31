using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly KnowledgeBase _kb;
    private readonly GeminiClient _gemini;

    public HealthController(KnowledgeBase kb, GeminiClient gemini)
    {
        _kb = kb;
        _gemini = gemini;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var kbLoaded = !string.IsNullOrEmpty(_kb.EarthquakeInstructions);
        var geminiOk = await _gemini.PingAsync(ct);
        return Ok(new
        {
            status = kbLoaded && geminiOk ? "ok" : "degraded",
            knowledgeBase = kbLoaded,
            geminiReachable = geminiOk,
            activeModel = _gemini.LastUsedModel ?? _gemini.PrimaryModel
        });
    }
}
