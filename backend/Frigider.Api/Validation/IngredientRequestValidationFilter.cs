using Frigider.Api.Endpoints;

namespace Frigider.Api.Validation;

public sealed class IngredientRequestValidationFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var request = context.Arguments.OfType<MatchRecipesRequest>().SingleOrDefault();

        if (request is null)
        {
            return await next(context);
        }

        if (request.Ingredients is null || request.Ingredients.Length == 0)
        {
            return Results.Problem(statusCode: 400, title: "Lista de ingrediente este goală.", detail: "Trimite cel puțin un ingredient.");
        }

        if (request.Ingredients.Length > 50)
        {
            return Results.Problem(statusCode: 400, title: "Prea multe ingrediente.", detail: "Poți trimite cel mult 50 de ingrediente.");
        }

        if (request.Ingredients.Any(string.IsNullOrWhiteSpace))
        {
            return Results.Problem(statusCode: 400, title: "Ingredient invalid.", detail: "Fiecare ingredient trebuie să conțină text.");
        }

        if (request.Ingredients.Any(ingredient => ingredient.Length > 60))
        {
            return Results.Problem(statusCode: 400, title: "Ingredient prea lung.", detail: "Fiecare ingredient poate avea cel mult 60 de caractere.");
        }

        if (!string.Equals(request.Language, "ro", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(request.Language, "en", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(request.Language, "ru", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Problem(statusCode: 400, title: "Limba nu este validă.", detail: "Limba trebuie să fie 'ro', 'en' sau 'ru'.");
        }

        return await next(context);
    }
}
