using Frigider.Api.Domain;

namespace Frigider.Api.Matching;

public sealed class RecipeMatcher
{
    public IReadOnlyList<RecipeMatchResult> Match(
        IEnumerable<string> userIngredients,
        IEnumerable<Recipe> recipes)
    {
        var normalizedUserIngredients = userIngredients
            .Select(IngredientNormalizer.Normalize)
            .Where(name => !string.IsNullOrEmpty(name))
            .ToHashSet(StringComparer.Ordinal);

        return recipes
            .Select(recipe => CreateResult(recipe, normalizedUserIngredients))
            .OrderBy(result => result.MissingCount)
            .ThenBy(result => result.TotalIngredientCount)
            .ThenBy(result => result.Recipe.PrepTimeMinutes)
            .ThenBy(result => result.Recipe.Name, StringComparer.Ordinal)
            .ToArray();
    }

    private static RecipeMatchResult CreateResult(
        Recipe recipe,
        IReadOnlySet<string> normalizedUserIngredients)
    {
        var matched = new List<Ingredient>();
        var missing = new List<Ingredient>();

        foreach (var recipeIngredient in recipe.RecipeIngredients)
        {
            var ingredient = recipeIngredient.Ingredient;

            if (ingredient.IsPantryStaple)
            {
                continue;
            }

            var normalizedName = IngredientNormalizer.Normalize(
                string.IsNullOrWhiteSpace(ingredient.NormalizedName)
                    ? ingredient.Name
                    : ingredient.NormalizedName);

            if (normalizedUserIngredients.Contains(normalizedName)
                || ingredient.Translations.Any(t => normalizedUserIngredients.Contains(IngredientNormalizer.Normalize(t.Name))))
            {
                matched.Add(ingredient);
            }
            else
            {
                missing.Add(ingredient);
            }
        }

        var nonStapleCount = matched.Count + missing.Count;
        var missingCount = missing.Count;

        return new RecipeMatchResult
        {
            Recipe = recipe,
            Matched = matched,
            Missing = missing,
            MissingCount = missingCount,
            MatchRatio = nonStapleCount == 0 ? 0 : (double)matched.Count / nonStapleCount,
            MatchStatus = missingCount switch
            {
                0 => MatchStatus.CanCookNow,
                1 => MatchStatus.OneMissing,
                <= 3 => MatchStatus.FewMissing,
                _ => MatchStatus.ManyMissing
            }
        };
    }
}

public sealed class RecipeMatchResult
{
    public required Recipe Recipe { get; init; }

    public required IReadOnlyList<Ingredient> Matched { get; init; }

    public required IReadOnlyList<Ingredient> Missing { get; init; }

    public int MissingCount { get; init; }

    public double MatchRatio { get; init; }

    public MatchStatus MatchStatus { get; init; }

    public int TotalIngredientCount => Recipe.RecipeIngredients.Count;
}

public enum MatchStatus
{
    CanCookNow,
    OneMissing,
    FewMissing,
    ManyMissing
}
