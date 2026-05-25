using System.Text;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/incidents/{id:guid}/report")]
public class ReportsController : ControllerBase
{
    private readonly IncidentStore _store;
    private readonly ReportRenderer _renderer;

    public ReportsController(IncidentStore store, ReportRenderer renderer)
    {
        _store = store;
        _renderer = renderer;
    }

    [HttpGet]
    public IActionResult Get(Guid id, [FromQuery] string? format = null)
    {
        var incident = _store.Get(id);
        if (incident is null) return NotFound();

        var markdown = _renderer.Render(incident);

        if (string.Equals(format, "download", StringComparison.OrdinalIgnoreCase))
        {
            var bytes = Encoding.UTF8.GetBytes(markdown);
            var filename = $"incident-{id}.md";
            return File(bytes, "text/markdown; charset=utf-8", filename);
        }

        return Content(markdown, "text/markdown; charset=utf-8", Encoding.UTF8);
    }
}
