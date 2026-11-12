using Frigider.Api.Endpoints;

namespace Frigider.Api.Extensions;

public static class EndpointRouteBuilderExtensions
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/health", () => TypedResults.Ok(new HealthResponse("ok")));
        endpoints.MapGet("/health", () => TypedResults.Ok(new HealthResponse("ok")))
                 .WithName("GetHealth")
                 .WithSummary("Verificare stare de funcționare a serviciului");

        return endpoints;
    }

    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapRecipeEndpoints();
        return endpoints;
    }
}

public sealed record HealthResponse(string Status);


