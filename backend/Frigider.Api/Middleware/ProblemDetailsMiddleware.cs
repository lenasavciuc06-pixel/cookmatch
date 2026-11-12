namespace Frigider.Api.Middleware;

public sealed class ProblemDetailsMiddleware(
    RequestDelegate next,
    ILogger<ProblemDetailsMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception while processing {Path}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";

            await Results.Problem(
                statusCode: context.Response.StatusCode,
                title: "Eroare internă",
                detail: environment.IsDevelopment() ? exception.Message : "A apărut o eroare internă.").ExecuteAsync(context);
        }
    }
}