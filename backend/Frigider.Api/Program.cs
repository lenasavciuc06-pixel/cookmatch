using Frigider.Api.Data;
using Frigider.Api.Data.Seed;
using Frigider.Api.Extensions;
using Microsoft.AspNetCore.Connections;
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

    await dbContext.Database.OpenConnectionAsync();
    var source = (Microsoft.Data.Sqlite.SqliteConnection)dbContext.Database.GetDbConnection();
    var backupPath = source.DataSource + ".backup-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
    using (var backup = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={backupPath}"))
    {
        backup.Open();
        source.BackupDatabase(backup);
    }
    Console.WriteLine($"Database backup: {backupPath}");
    await dbContext.Database.MigrateAsync();
    await using var transaction = await dbContext.Database.BeginTransactionAsync();
    await SeedRunner.SeedAsync(dbContext, updateInstructions: args.Contains("--update-instructions", StringComparer.OrdinalIgnoreCase));
    await transaction.CommitAsync();

    return;
}

// Pipeline middleware și mapare endpoint-uri prin extension methods
app.UseApplicationPipeline();

try
{
    await app.RunAsync();
}
catch (IOException exception) when (exception.InnerException is AddressInUseException)
{
    // A duplicate launch must fail without an unhandled CLR exception / Windows crash dialog.
    // Do not kill the process holding the port or silently switch the API to a different port.
    Console.Error.WriteLine(
        $"CookMatch could not start: http://0.0.0.0:{port} is already in use. " +
        "Keep the existing backend instance, or identify and stop it before starting another. " +
        "No automatic restart will be attempted.");
    Console.Error.WriteLine(exception);
    Environment.ExitCode = 1;
}

// Expunere clasă Program pentru teste de integrare
public partial class Program { }

