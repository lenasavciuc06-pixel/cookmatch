using System.Text.Json;
using Frigider.Api.Domain;
using Frigider.Api.Matching;
using Microsoft.EntityFrameworkCore;

namespace Frigider.Api.Data.Seed;

public static class SeedRunner
{
    private const string IngredientsFileName = "ingredients.json";
    private const string RecipesFileName = "recipes.json";

    public static async Task SeedAsync(AppDbContext dbContext, CancellationToken cancellationToken = default)
    {
        var seedRoot = Path.Combine(AppContext.BaseDirectory, "Data", "Seed");
        var ingredientsPath = Path.Combine(seedRoot, IngredientsFileName);
        var recipesPath = Path.Combine(seedRoot, RecipesFileName);

        if (!File.Exists(ingredientsPath) || !File.Exists(recipesPath))
        {
            throw new FileNotFoundException("Seed files not found in Data/Seed.");
        }

        var ingredientSeed = await ReadJsonFileAsync<IngredientSeedDocument>(ingredientsPath, cancellationToken);
        var recipeSeed = await ReadJsonFileAsync<RecipeSeedDocument>(recipesPath, cancellationToken);

        if (ingredientSeed is null || recipeSeed is null)
        {
            throw new InvalidOperationException("Seed data was empty.");
        }

        var ingredientEntities = ingredientSeed.Ingredients
            .Select(x => new Ingredient
            {
                Name = x.Name.Trim(),
                NormalizedName = IngredientNormalizer.Normalize(x.Name),
                IsPantryStaple = x.IsPantryStaple,
                Translations = x.Translations
                    .Select(t => new IngredientTranslation
                    {
                        LanguageCode = t.LanguageCode,
                        Name = t.Name.Trim(),
                    })
                    .ToList()
            })
            .ToList();

        await SeedIngredientsAsync(dbContext, ingredientEntities, cancellationToken);
        await SeedRecipesAsync(dbContext, recipeSeed.Recipes, cancellationToken);
    }

    private static async Task SeedIngredientsAsync(AppDbContext dbContext, List<Ingredient> ingredients, CancellationToken cancellationToken)
    {
        foreach (var ingredient in ingredients)
        {
            var existing = await dbContext.Ingredients
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.NormalizedName == ingredient.NormalizedName, cancellationToken);

            if (existing is not null)
            {
                continue;
            }

            dbContext.Ingredients.Add(ingredient);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedRecipesAsync(AppDbContext dbContext, List<RecipeSeed> recipes, CancellationToken cancellationToken)
    {
        foreach (var recipeSeed in recipes)
        {
            var existingRecipe = await dbContext.Recipes
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Slug == recipeSeed.Slug, cancellationToken);

            if (existingRecipe is not null)
            {
                continue;
            }

            var recipe = new Recipe
            {
                Slug = recipeSeed.Slug,
                Name = recipeSeed.Name,
                Description = recipeSeed.Description,
                ImageUrl = recipeSeed.ImageUrl,
                Category = Enum.Parse<RecipeCategory>(recipeSeed.Category, ignoreCase: true),
                PrepTimeMinutes = recipeSeed.PrepTimeMinutes,
                Difficulty = Enum.Parse<Difficulty>(recipeSeed.Difficulty, ignoreCase: true),
                Servings = recipeSeed.Servings,
                Instructions = recipeSeed.Instructions,
                RecipeIngredients = new List<RecipeIngredient>()
            };

            foreach (var item in recipeSeed.Ingredients)
            {
                var ingredient = await dbContext.Ingredients
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.NormalizedName == IngredientNormalizer.Normalize(item.Name), cancellationToken);

                if (ingredient is null)
                {
                    ingredient = await dbContext.Ingredients
                        .AsNoTracking()
                        .FirstOrDefaultAsync(x => x.Name == item.Name, cancellationToken);
                }

                if (ingredient is null)
                {
                    throw new InvalidOperationException($"Ingredient '{item.Name}' not found for recipe '{recipeSeed.Name}'.");
                }

                recipe.RecipeIngredients.Add(new RecipeIngredient
                {
                    Ingredient = ingredient,
                    Quantity = item.Quantity
                });
            }

            recipe.Translations = BuildRecipeTranslations(recipeSeed.Translations);
            dbContext.Recipes.Add(recipe);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static List<RecipeTranslation> BuildRecipeTranslations(Dictionary<string, RecipeTranslationSeed> translations)
    {
        return translations
            .Select(x => new RecipeTranslation
            {
                LanguageCode = x.Key,
                Name = x.Value.Name,
                Description = x.Value.Description,
                Instructions = x.Value.Instructions
            })
            .ToList();
    }

    private static async Task<T?> ReadJsonFileAsync<T>(string path, CancellationToken cancellationToken)
    {
        using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<T>(stream, cancellationToken: cancellationToken);
    }

    private sealed class IngredientSeedDocument
    {
        public List<IngredientSeed> Ingredients { get; set; } = [];
    }

    private sealed class IngredientSeed
    {
        public string Name { get; set; } = string.Empty;
        public bool IsPantryStaple { get; set; }
        public List<IngredientTranslationSeed> Translations { get; set; } = [];
    }

    private sealed class IngredientTranslationSeed
    {
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    private sealed class RecipeSeedDocument
    {
        public List<RecipeSeed> Recipes { get; set; } = [];
    }

    private sealed class RecipeSeed
    {
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int PrepTimeMinutes { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public int Servings { get; set; }
        public List<string> Instructions { get; set; } = [];
        public List<RecipeIngredientSeed> Ingredients { get; set; } = [];
        public Dictionary<string, RecipeTranslationSeed> Translations { get; set; } = new();
    }

    private sealed class RecipeIngredientSeed
    {
        public string Name { get; set; } = string.Empty;
        public string Quantity { get; set; } = string.Empty;
    }

    private sealed class RecipeTranslationSeed
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Instructions { get; set; } = [];
    }
}
