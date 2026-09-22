using Frigider.Api.Data;
using Frigider.Api.Data.Seed;
using Frigider.Api.Extensions;
using Microsoft.EntityFrameworkCore;

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

if (args.Contains("seed", StringComparer.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    await dbContext.Database.EnsureDeletedAsync();
    await dbContext.Database.MigrateAsync();
    await SeedRunner.SeedAsync(dbContext);

    return;
}

// Pipeline middleware și mapare endpoint-uri prin extension methods
app.UseApplicationPipeline();

app.Run();

// Expunere clasă Program pentru teste de integrare
public partial class Program { }
