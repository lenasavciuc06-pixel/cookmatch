using System.Text.Json;
using System.Text.Json.Serialization;
using Frigider.Api.Data;
using Frigider.Api.Matching;
using Microsoft.EntityFrameworkCore;

namespace Frigider.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public const string FrontendCorsPolicyName = "Frontend";
    private static readonly string[] DevelopmentFrontendOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ];

    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddResponseCaching();
        services.AddResponseCompression(options => options.EnableForHttps = true);
        services.AddMemoryCache();
        services.AddSingleton<IngredientCatalogCache>();
        services.AddHostedService<IngredientCatalogWarmupService>();
        services.AddSingleton<RecipeMatcher>();
        var connectionString = new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(
            configuration.GetConnectionString("FrigiderDb"));
        if (!string.IsNullOrEmpty(connectionString.DataSource)
            && connectionString.DataSource != ":memory:"
            && connectionString.Mode != Microsoft.Data.Sqlite.SqliteOpenMode.Memory
            && !Path.IsPathRooted(connectionString.DataSource))
        {
            connectionString.DataSource = Path.GetFullPath(connectionString.DataSource, environment.ContentRootPath);
        }
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(connectionString.ToString()));

        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        services.AddCors(options =>
        {
            options.AddPolicy(FrontendCorsPolicyName, policy =>
            {
                if (environment.IsDevelopment())
                {
                    policy.WithOrigins(DevelopmentFrontendOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                }
                else
                {
                    var frontendOrigin = configuration["FRONTEND_ORIGIN"]
                        ?? Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");

                    if (!string.IsNullOrWhiteSpace(frontendOrigin))
                    {
                        var allowedOrigins = frontendOrigin
                            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                        policy.WithOrigins(allowedOrigins)
                              .AllowAnyHeader()
                              .AllowAnyMethod();
                    }
                }
            });
        });

        return services;
    }
}


