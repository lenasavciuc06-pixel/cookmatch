using Frigider.Api.Domain;
using Frigider.Api.Matching;

namespace Frigider.Api.Endpoints;

public sealed record MatchRecipesRequest(string[] Ingredients, string Language);

public sealed record RecipeListQuery(
    string? Search,
    string? Category,
    int? MaxTime,
    string? Difficulty,
    string? Ingredient,
    string? Language,
    int? Page,
    int? PageSize);

public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public sealed record RecipeSummaryDto(
    string Slug,
    string Name,
    string Description,
    string ImageUrl,
    string Category,
    int PrepTimeMinutes,
    string Difficulty,
    int Servings);

public sealed record MatchedRecipeDto(
    RecipeSummaryDto Recipe,
    MatchStatus MatchStatus,
    int MissingCount,
    IReadOnlyList<string> MatchedIngredients,
    IReadOnlyList<string> MissingIngredients);

public sealed record RecipeIngredientDto(
    string Name,
    string Quantity,
    bool IsPantryStaple,
    bool IsAvailable);

public sealed record RecipeDetailsDto(
    RecipeSummaryDto Recipe,
    IReadOnlyList<string> Instructions,
    IReadOnlyList<RecipeIngredientDto> Ingredients);

public sealed record IngredientDto(string Name, bool IsPantryStaple);

public sealed record CategoryDto(string Value, string LabelRo, string LabelEn);