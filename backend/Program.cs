using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddSingleton<KnowledgeBase>();
builder.Services.AddHttpClient<GeminiClient>();
 builder.Services.AddSingleton<IncidentStore>();
  builder.Services.AddScoped<SituationalAgent>();
  builder.Services.AddScoped<SpecialistAgent>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();

app.Run();
