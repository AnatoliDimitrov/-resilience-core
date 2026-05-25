using backend.BackgroundServices;
using backend.Persistence;
using backend.Services;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();

builder.Services.AddSingleton<KnowledgeBase>();
builder.Services.AddHttpClient<GeminiClient>();
builder.Services.AddSingleton<IncidentStore>();
builder.Services.AddScoped<SituationalAgent>();
builder.Services.AddScoped<SpecialistAgent>();
builder.Services.AddScoped<ReportRenderer>();
builder.Services.AddHostedService<ReassessmentService>();

var dbPath = builder.Configuration["Database:Path"] ?? "data/incidents.db";
var dbDir = Path.GetDirectoryName(Path.GetFullPath(dbPath));
if (!string.IsNullOrEmpty(dbDir)) Directory.CreateDirectory(dbDir);
builder.Services.AddDbContextFactory<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler(handler => handler.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, message) = ClassifyError(ex);

    var logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Request {Method} {Path} failed → {Status} {Message}",
        ctx.Request.Method, ctx.Request.Path, status, message);

    ctx.Response.StatusCode = status;
    ctx.Response.ContentType = "application/json; charset=utf-8";
    await ctx.Response.WriteAsJsonAsync(new { error = message, status });
}));

_ = app.Services.GetRequiredService<KnowledgeBase>();

using (var scope = app.Services.CreateScope())
{
    var factory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AppDbContext>>();
    using var db = factory.CreateDbContext();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();

app.Run();

static (int status, string message) ClassifyError(Exception? ex)
{
    if (ex is null) return (500, "Възникна неочаквана грешка.");

    var raw = ex.Message ?? "";

    if (raw.Contains("429") || raw.Contains("RESOURCE_EXHAUSTED") || raw.Contains("quota", StringComparison.OrdinalIgnoreCase))
        return (503, "Системата е претоварена в момента (лимит на ИИ услугата). Изчакайте няколко секунди и опитайте отново.");

    if (raw.Contains("503") || raw.Contains("UNAVAILABLE") || raw.Contains("overloaded", StringComparison.OrdinalIgnoreCase))
        return (503, "ИИ услугата е временно недостъпна. Опитайте отново след малко.");

    if (ex is TaskCanceledException || ex is TimeoutException)
        return (504, "Времето за отговор от ИИ изтече. Опитайте отново.");

    if (raw.Contains("401") || raw.Contains("403") || raw.Contains("API key", StringComparison.OrdinalIgnoreCase))
        return (500, "Проблем с конфигурацията на ИИ услугата. Свържете се с администратор.");

    if (ex is System.Text.Json.JsonException)
        return (502, "ИИ върна неочакван формат на отговора. Опитайте отново.");

    if (ex is HttpRequestException)
        return (502, "Грешка при свързване с ИИ услугата. Проверете мрежата и опитайте отново.");

    return (500, "Възникна вътрешна грешка. Опитайте отново или докладвайте на администратор.");
}
