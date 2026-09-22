namespace Frigider.Api.Extensions;

public static class EndpointRouteBuilderExtensions
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/health", () => TypedResults.Ok(new HealthResponse("ok")))
                 .WithName("GetHealth")
                 .WithSummary("Verificare stare de funcționare a serviciului");

        return endpoints;
    }
}

public sealed record HealthResponse(string Status);

