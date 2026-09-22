using System.Text.Json;
using System.Text.Json.Serialization;

namespace Frigider.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public const string FrontendCorsPolicyName = "Frontend";
    private const string DevelopmentFrontendOrigin = "http://localhost:5173";

    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

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
                    policy.WithOrigins(DevelopmentFrontendOrigin)
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

