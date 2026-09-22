using Frigider.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Kestrel binding explicit pe 0.0.0.0:{PORT} cu fallback pe 8080 (Vercel container)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Logging exclusiv în consolă (fără fișiere, fără EventLog)
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Înregistrare servicii prin extension methods
builder.Services.AddApplicationServices(builder.Environment, builder.Configuration);

var app = builder.Build();

// Pipeline middleware și mapare endpoint-uri prin extension methods
app.UseApplicationPipeline();

app.Run();

// Expunere clasă Program pentru teste de integrare
public partial class Program { }
