using Frigider.Api.Data;
using Frigider.Api.Domain;
using Frigider.Api.Matching;
using Frigider.Api.Validation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Frigider.Api.Endpoints;

public static class RecipeEndpoints
{
    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var recipes = endpoints.MapGroup("/api/recipes").WithTags("Recipes");

        recipes.MapPost("/match", MatchRecipes)
            .AddEndpointFilter<IngredientRequestValidationFilter>()
            .WithSummary("Potrivește ingredientele cu rețetele")
            .WithDescription("Returnează rețetele ordonate după cât de aproape sunt de a putea fi gătite. Exemplu răspuns: [{\"recipe\":{\"slug\":\"omleta-cu-ceapa-si-branza\"},\"matchStatus\":\"CanCookNow\",\"missingCount\":0,\"matchedIngredients\":[\"ouă\"],\"missingIngredients\":[]}]")
            .Produces<IReadOnlyList<MatchedRecipeDto>>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        recipes.MapGet("", ListRecipes)
            .WithSummary("Listează rețetele")
            .WithDescription("Returnează un catalog paginat și filtrabil de rețete. Exemplu răspuns: {\"items\":[{\"slug\":\"omleta-cu-ceapa-si-branza\",\"name\":\"Omletă cu ceapă și brânză\"}],\"totalCount\":30,\"page\":1,\"pageSize\":20}")
            .Produces<PagedResponse<RecipeSummaryDto>>()
            .WithMetadata(CacheFor(60));

        recipes.MapGet("/{slug}", GetRecipe)
            .WithSummary("Obține o rețetă")
            .WithDescription("Returnează rețeta completă, inclusiv cantitățile și starea ingredientelor. Exemplu răspuns: {\"recipe\":{\"slug\":\"omleta-cu-ceapa-si-branza\"},\"instructions\":[\"Călește ceapa\"],\"ingredients\":[{\"name\":\"ouă\",\"quantity\":\"4\",\"isAvailable\":true}]}")
            .Produces<RecipeDetailsDto>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .WithMetadata(CacheFor(60));

        endpoints.MapGet("/api/ingredients", ListIngredients)
            .WithTags("Catalog")
            .WithSummary("Listează ingredientele")
            .WithDescription("Returnează catalogul complet de ingrediente pentru autocomplete. Exemplu răspuns: [{\"name\":\"cartofi\",\"isPantryStaple\":false}]")
            .Produces<IReadOnlyList<IngredientDto>>()
            .WithMetadata(CacheFor(300));

        endpoints.MapGet("/api/categories", ListCategories)
            .WithTags("Catalog")
            .WithSummary("Listează categoriile")
            .WithDescription("Returnează categoriile cu etichete în română și engleză. Exemplu răspuns: [{\"value\":\"Breakfast\",\"labelRo\":\"Mic dejun\",\"labelEn\":\"Breakfast\"}]")
            .Produces<IReadOnlyList<CategoryDto>>()
            .WithMetadata(CacheFor(300));

        return endpoints;
    }

    private static async Task<IResult> MatchRecipes(
        MatchRecipesRequest request,
        AppDbContext dbContext,
        RecipeMatcher matcher,
        CancellationToken cancellationToken)
    {
        var recipes = await dbContext.Recipes
            .Include(recipe => recipe.RecipeIngredients)
            .ThenInclude(link => link.Ingredient)
            .ThenInclude(ingredient => ingredient.Translations)
            .Include(recipe => recipe.Translations)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var language = NormalizeLanguage(request.Language);
        var response = matcher.Match(request.Ingredients, recipes)
            .Select(result => new MatchedRecipeDto(
                ToSummary(result.Recipe, language),
                result.MatchStatus,
                result.MissingCount,
                result.Matched.Select(ingredient => TranslateIngredient(ingredient, language)).ToArray(),
                result.Missing.Select(ingredient => TranslateIngredient(ingredient, language)).ToArray()))
            .ToArray();

        return TypedResults.Ok(response);
    }

    private static async Task<IResult> ListRecipes(
        [AsParameters] RecipeListQuery query,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(query.Page ?? 1, 1);
        var pageSize = Math.Clamp(query.PageSize ?? 20, 1, 100);
        var language = NormalizeLanguage(query.Language);
        var recipes = dbContext.Recipes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            // SQLite lower() is ASCII-only. Fold localized text in .NET so Cyrillic
            // searches work regardless of case, then retain SQL filtering/pagination.
            var search = query.Search.Trim().ToLowerInvariant();
            var searchable = await recipes.Select(recipe => new
            {
                recipe.Slug, recipe.Name, recipe.Description,
                Translation = recipe.Translations.Where(t => t.LanguageCode == language)
                    .Select(t => new { t.Name, t.Description }).FirstOrDefault()
            }).ToListAsync(cancellationToken);
            var slugs = searchable.Where(r => r.Name.ToLowerInvariant().Contains(search) || r.Description.ToLowerInvariant().Contains(search)
                || (r.Translation?.Name ?? r.Name).ToLowerInvariant().Contains(search)
                || (r.Translation?.Description ?? r.Description).ToLowerInvariant().Contains(search))
                .Select(r => r.Slug).ToArray();
            recipes = recipes.Where(recipe => slugs.Contains(recipe.Slug));
        }

        if (Enum.TryParse<RecipeCategory>(query.Category, true, out var category))
        {
            recipes = recipes.Where(recipe => recipe.Category == category);
        }

        if (query.MaxTime is not null)
        {
            recipes = recipes.Where(recipe => recipe.PrepTimeMinutes <= query.MaxTime);
        }

        if (Enum.TryParse<Difficulty>(query.Difficulty, true, out var difficulty))
        {
            recipes = recipes.Where(recipe => recipe.Difficulty == difficulty);
        }

        if (!string.IsNullOrWhiteSpace(query.Ingredient))
        {
            var ingredient = IngredientNormalizer.Normalize(query.Ingredient);
            var aliases = await dbContext.Ingredients.AsNoTracking().Include(i => i.Translations).ToListAsync(cancellationToken);
            var ids = aliases.Where(i => i.NormalizedName == ingredient
                || i.Translations.Any(t => IngredientNormalizer.Normalize(t.Name) == ingredient)).Select(i => i.Id).ToArray();
            recipes = recipes.Where(recipe => recipe.RecipeIngredients.Any(link => ids.Contains(link.IngredientId)));
        }

        var totalCount = await recipes.CountAsync(cancellationToken);
        var items = await recipes
            .OrderBy(recipe => recipe.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(recipe => new RecipeSummaryProjection(
                recipe.Slug,
                recipe.Name,
                recipe.Description,
                recipe.ImageUrl,
                recipe.Category,
                recipe.PrepTimeMinutes,
                recipe.Difficulty,
                recipe.Servings,
                recipe.Translations
                    .Where(translation => translation.LanguageCode == language)
                    .Select(translation => new TranslationProjection(translation.Name, translation.Description))
                    .FirstOrDefault()))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new PagedResponse<RecipeSummaryDto>(
            items.Select(item => item.ToDto(language)).ToArray(), totalCount, page, pageSize));
    }

    private static async Task<IResult> GetRecipe(
        string slug,
        string? ingredients,
        string? language,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var selectedLanguage = NormalizeLanguage(language);
        var recipe = await dbContext.Recipes
            .AsNoTracking()
            .Where(item => item.Slug == slug)
            .Select(item => new RecipeDetailsProjection(
                item.Slug,
                item.Name,
                item.Description,
                item.ImageUrl,
                item.Category,
                item.PrepTimeMinutes,
                item.Difficulty,
                item.Servings,
                item.Instructions,
                item.Translations
                    .Where(translation => translation.LanguageCode == selectedLanguage)
                    .Select(translation => new TranslationProjection(translation.Name, translation.Description, translation.Instructions))
                    .FirstOrDefault(),
                item.RecipeIngredients
                    .Select(link => new IngredientProjection(link.Ingredient.Name, link.Ingredient.NormalizedName, link.Ingredient.IsPantryStaple, link.Quantity,
                        link.Ingredient.Translations.Where(t => t.LanguageCode == selectedLanguage).Select(t => t.Name).FirstOrDefault(),
                        link.Ingredient.Translations.Select(t => t.Name).ToArray()))
                    .ToArray()))
            .SingleOrDefaultAsync(cancellationToken);

        if (recipe is null)
        {
            return TypedResults.NotFound();
        }

        var available = (ingredients ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(IngredientNormalizer.Normalize)
            .ToHashSet(StringComparer.Ordinal);

        return TypedResults.Ok(recipe.ToDto(selectedLanguage, available));
    }

    private static async Task<IResult> ListIngredients(
        AppDbContext dbContext,
        IngredientCatalogCache catalogCache,
        string? language,
        CancellationToken cancellationToken)
    {
        var catalog = await catalogCache.GetAsync(dbContext, cancellationToken);
        var selectedLanguage = NormalizeLanguage(language);
        if (selectedLanguage == "ro") return TypedResults.Ok(catalog);
        var translations = await dbContext.Ingredients.AsNoTracking()
            .Select(i => new IngredientDto(i.Translations.Where(t => t.LanguageCode == selectedLanguage).Select(t => t.Name).FirstOrDefault() ?? i.Name, i.IsPantryStaple))
            .ToListAsync(cancellationToken);
        return TypedResults.Ok(translations.OrderBy(i => i.Name, StringComparer.Create(System.Globalization.CultureInfo.GetCultureInfo(selectedLanguage), false)).ToArray());
    }

    private static IResult ListCategories() => TypedResults.Ok(
        Enum.GetValues<RecipeCategory>()
            .Select(category => new CategoryDto(category.ToString(), CategoryLabel(category, "ro"), CategoryLabel(category, "en")))
            .ToArray());

    private static RecipeSummaryDto ToSummary(Recipe recipe, string language)
    {
        var translation = recipe.Translations.FirstOrDefault(item => item.LanguageCode == language);
        return new RecipeSummaryDto(recipe.Slug, translation?.Name ?? recipe.Name, translation?.Description ?? recipe.Description, recipe.ImageUrl, recipe.Category.ToString(), recipe.PrepTimeMinutes, recipe.Difficulty.ToString(), recipe.Servings);
    }

    private static string TranslateIngredient(Ingredient ingredient, string language) => ingredient.Translations.FirstOrDefault(item => item.LanguageCode == language)?.Name ?? ingredient.Name;

    private static string NormalizeLanguage(string? language) => language?.ToLowerInvariant() switch { "en" => "en", "ru" => "ru", _ => "ro" };

    private static ResponseCacheAttribute CacheFor(int seconds) => new() { Duration = seconds, Location = ResponseCacheLocation.Any };

    private static string CategoryLabel(RecipeCategory category, string language) => (category, language) switch
    {
        (RecipeCategory.Breakfast, "ro") => "Mic dejun",
        (RecipeCategory.Lunch, "ro") => "Prânz",
        (RecipeCategory.Dinner, "ro") => "Cină",
        (RecipeCategory.Dessert, "ro") => "Desert",
        (RecipeCategory.Soup, "ro") => "Supă",
        (RecipeCategory.Salad, "ro") => "Salată",
        (RecipeCategory.Pasta, "ro") => "Paste",
        (RecipeCategory.Meat, "ro") => "Carne",
        (RecipeCategory.Vegetarian, "ro") => "Vegetarian",
        (RecipeCategory.Quick, "ro") => "Rapid",
        (RecipeCategory.Budget, "ro") => "Economic",
        _ => category.ToString()
    };

    private sealed record TranslationProjection(string Name, string Description, List<string>? Instructions = null);

    private sealed record RecipeSummaryProjection(string Slug, string Name, string Description, string ImageUrl, RecipeCategory Category, int PrepTimeMinutes, Difficulty Difficulty, int Servings, TranslationProjection? Translation)
    {
        public RecipeSummaryDto ToDto(string language) => new(Slug, language == "ro" ? Name : Translation?.Name ?? Name, language == "ro" ? Description : Translation?.Description ?? Description, ImageUrl, Category.ToString(), PrepTimeMinutes, Difficulty.ToString(), Servings);
    }

    private sealed record IngredientProjection(string Name, string NormalizedName, bool IsPantryStaple, string Quantity, string? TranslatedName, string[] Aliases);

    private sealed record RecipeDetailsProjection(string Slug, string Name, string Description, string ImageUrl, RecipeCategory Category, int PrepTimeMinutes, Difficulty Difficulty, int Servings, List<string> Instructions, TranslationProjection? Translation, IngredientProjection[] Ingredients)
    {
        public RecipeDetailsDto ToDto(string language, IReadOnlySet<string> available)
        {
            var summary = new RecipeSummaryDto(Slug, language == "ro" ? Name : Translation?.Name ?? Name, language == "ro" ? Description : Translation?.Description ?? Description, ImageUrl, Category.ToString(), PrepTimeMinutes, Difficulty.ToString(), Servings);
            var translatedInstructions = language == "ro" ? Instructions : Translation?.Instructions ?? Instructions;
            var mappedIngredients = Ingredients.Select(ingredient => new RecipeIngredientDto(ingredient.TranslatedName ?? ingredient.Name,
                language == "ru" ? TranslateQuantity(ingredient.Quantity) : ingredient.Quantity, ingredient.IsPantryStaple,
                ingredient.IsPantryStaple || available.Contains(ingredient.NormalizedName) || ingredient.Aliases.Any(name => available.Contains(IngredientNormalizer.Normalize(name))))).ToArray();
            return new RecipeDetailsDto(summary, translatedInstructions, mappedIngredients);
        }
    }

    private static string TranslateQuantity(string quantity) => quantity
        .Replace("după gust", "по вкусу").Replace("lingurițe", "ч. л.").Replace("linguriță", "ч. л.")
        .Replace("linguri", "ст. л.").Replace("lingură", "ст. л.").Replace("felii", "ломтика").Replace("felie", "ломтик")
        .Replace("căni", "стакана").Replace("cană", "стакан").Replace("căței", "зубчика").Replace("cățel", "зубчик")
        .Replace("bucăți", "шт.").Replace("bucată", "шт.").Replace("tulpină", "стебель").Replace("legătură", "пучок").Replace("mână", "горсть")
        .Replace("ml", "мл").Replace("kg", "кг").Replace(" g", " г").Replace(" l", " л");
}
