using Frigider.Api.Middleware;

namespace Frigider.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseApplicationPipeline(this WebApplication app)
    {
        app.UseMiddleware<ProblemDetailsMiddleware>();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors(ServiceCollectionExtensions.FrontendCorsPolicyName);
        app.UseResponseCompression();
        app.UseResponseCaching();

        app.MapHealthEndpoints();
        app.MapApiEndpoints();

        return app;
    }
}

