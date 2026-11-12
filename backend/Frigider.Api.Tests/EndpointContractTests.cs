using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Frigider.Api.Data;
using Frigider.Api.Domain;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Frigider.Api.Tests;

public sealed class EndpointContractTests : IClassFixture<EndpointApiFactory>
{
    private readonly HttpClient client;

    public EndpointContractTests(EndpointApiFactory factory)
    {
        client = factory.CreateClient();
    }

    [Fact]
    public async Task Match_EmptyIngredients_ReturnsBadRequestWithClearMessage()
    {
        var response = await client.PostAsJsonAsync("/api/recipes/match", new { ingredients = Array.Empty<string>(), language = "ro" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ingredient", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Match_MoreThanFiftyIngredients_ReturnsBadRequest()
    {
        var ingredients = Enumerable.Range(1, 51).Select(index => $"ingredient-{index}").ToArray();

        var response = await client.PostAsJsonAsync("/api/recipes/match", new { ingredients, language = "ro" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Match_IngredientLongerThanSixtyCharacters_ReturnsBadRequest()
    {
        var ingredients = new[] { new string('a', 61) };

        var response = await client.PostAsJsonAsync("/api/recipes/match", new { ingredients, language = "ro" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Match_ReturnsRequiredMatchFields()
    {
        var response = await client.PostAsJsonAsync("/api/recipes/match", new { ingredients = new[] { "cartofi" }, language = "ro" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var recipe = document.RootElement[0];

        Assert.True(recipe.TryGetProperty("matchStatus", out _));
        Assert.True(recipe.TryGetProperty("missingCount", out _));
        Assert.True(recipe.TryGetProperty("matchedIngredients", out _));
        Assert.True(recipe.TryGetProperty("missingIngredients", out _));
    }

    [Fact]
    public async Task ListRecipes_ReturnsPaginationTotalAndMainFilters()
    {
        var response = await client.GetAsync("/api/recipes?search=cartof&category=Breakfast&maxTime=20&difficulty=Easy&ingredient=cartofi&language=en&page=1&pageSize=1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var body = document.RootElement;

        Assert.Equal(1, body.GetProperty("totalCount").GetInt32());
        Assert.Equal(1, body.GetProperty("page").GetInt32());
        Assert.Equal(1, body.GetProperty("pageSize").GetInt32());
        Assert.Single(body.GetProperty("items").EnumerateArray());
        Assert.Equal("Potato omelet", body.GetProperty("items")[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task ListRecipes_DefaultPaginationReturnsTotalCountAndPageSize()
    {
        var response = await client.GetAsync("/api/recipes?page=1&pageSize=1");

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var body = document.RootElement;

        Assert.Equal(2, body.GetProperty("totalCount").GetInt32());
        Assert.Equal(1, body.GetProperty("pageSize").GetInt32());
        Assert.Single(body.GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task GetRecipe_ExistingSlugReturnsRecipeWithIngredientAvailability()
    {
        var response = await client.GetAsync("/api/recipes/test-recipe?ingredients=cartofi");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var ingredients = document.RootElement.GetProperty("ingredients").EnumerateArray().ToArray();

        Assert.Equal(3, ingredients.Length);
        Assert.True(ingredients.Single(item => item.GetProperty("name").GetString() == "cartofi").GetProperty("isAvailable").GetBoolean());
        Assert.False(ingredients.Single(item => item.GetProperty("name").GetString() == "ceapă").GetProperty("isAvailable").GetBoolean());
        Assert.True(ingredients.Single(item => item.GetProperty("name").GetString() == "sare").GetProperty("isAvailable").GetBoolean());
    }

    [Fact]
    public async Task GetRecipe_EnglishLanguageUsesTranslation()
    {
        var response = await client.GetAsync("/api/recipes/test-recipe?language=en");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Assert.Equal("Potato omelet", document.RootElement.GetProperty("recipe").GetProperty("name").GetString());
        Assert.Equal("Cook the ingredients.", document.RootElement.GetProperty("instructions")[0].GetString());
    }

    [Fact]
    public async Task Russian_CatalogSearchDetailsAndMatchingUseTranslations()
    {
        var results = await client.GetFromJsonAsync<JsonElement>("/api/recipes?language=ru&search=" + Uri.EscapeDataString("ОМЛЕТ"));
        Assert.Equal(1, results.GetProperty("totalCount").GetInt32());
        Assert.Equal("Омлет с картофелем", results.GetProperty("items")[0].GetProperty("name").GetString());
        var detail = await client.GetFromJsonAsync<JsonElement>("/api/recipes/test-recipe?language=ru&ingredients=" + Uri.EscapeDataString("картофель"));
        Assert.Equal("Приготовьте продукты.", detail.GetProperty("instructions")[0].GetString());
        var potato = detail.GetProperty("ingredients").EnumerateArray().Single(i => i.GetProperty("name").GetString() == "картофель");
        Assert.True(potato.GetProperty("isAvailable").GetBoolean());
        var catalog = await client.GetFromJsonAsync<JsonElement>("/api/ingredients?language=ru");
        Assert.Contains(catalog.EnumerateArray(), i => i.GetProperty("name").GetString() == "картофель");
        var response = await client.PostAsJsonAsync("/api/recipes/match", new { ingredients = new[] { "КАРТОФЕЛЬ" }, language = "ru" });
        response.EnsureSuccessStatusCode();
        var matches = await response.Content.ReadFromJsonAsync<JsonElement>();
        var match = matches.EnumerateArray().Single(r => r.GetProperty("recipe").GetProperty("slug").GetString() == "test-recipe");
        Assert.Equal(1, match.GetProperty("missingCount").GetInt32());
        Assert.Equal("картофель", match.GetProperty("matchedIngredients")[0].GetString());
        var filtered = await client.GetFromJsonAsync<JsonElement>("/api/recipes?language=ru&ingredient=" + Uri.EscapeDataString("картофель"));
        Assert.Equal(1, filtered.GetProperty("totalCount").GetInt32());
    }

    [Fact]
    public async Task GetRecipe_UnknownSlugReturnsNotFound()
    {
        var response = await client.GetAsync("/api/recipes/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetIngredients_ReturnsDtoShapeWithoutEfProperties()
    {
        var response = await client.GetAsync("/api/ingredients");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var ingredient = document.RootElement[0];

        Assert.True(ingredient.TryGetProperty("name", out _));
        Assert.True(ingredient.TryGetProperty("isPantryStaple", out _));
        Assert.False(ingredient.TryGetProperty("id", out _));
        Assert.False(ingredient.TryGetProperty("recipeIngredients", out _));
    }

    [Fact]
    public async Task GetCategories_ReturnsRomanianAndEnglishLabels()
    {
        var response = await client.GetAsync("/api/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var breakfast = document.RootElement.EnumerateArray().Single(item => item.GetProperty("value").GetString() == "Breakfast");

        Assert.Equal("Mic dejun", breakfast.GetProperty("labelRo").GetString());
        Assert.Equal("Breakfast", breakfast.GetProperty("labelEn").GetString());
    }

    [Fact]
    public void EndpointDtos_DoNotExposeEfEntities()
    {
        var dtoTypes = typeof(Program).Assembly
            .GetTypes()
            .Where(type => type.Namespace == "Frigider.Api.Endpoints" && type.Name.EndsWith("Dto", StringComparison.Ordinal));

        Assert.NotEmpty(dtoTypes);
        Assert.All(dtoTypes.SelectMany(type => type.GetProperties()), property =>
            Assert.False(typeof(Frigider.Api.Domain.Recipe).IsAssignableFrom(property.PropertyType)
                || typeof(Frigider.Api.Domain.Ingredient).IsAssignableFrom(property.PropertyType)
                || typeof(Frigider.Api.Domain.RecipeIngredient).IsAssignableFrom(property.PropertyType)));
    }
}

public sealed class EndpointApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        connection.Open();

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(connection));

            using var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            dbContext.Database.EnsureCreated();

            Seed(dbContext);
        });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            connection.Dispose();
        }

        base.Dispose(disposing);
    }

    private static void Seed(AppDbContext dbContext)
    {
        var potatoes = new Ingredient { Name = "cartofi", NormalizedName = "cartof" };
        potatoes.Translations.Add(new IngredientTranslation { LanguageCode = "ru", Name = "картофель" });
        var onion = new Ingredient { Name = "ceapă", NormalizedName = "ceapa" };
        var salt = new Ingredient { Name = "sare", NormalizedName = "sare", IsPantryStaple = true };
        dbContext.Ingredients.AddRange(potatoes, onion, salt);

        var breakfast = new Recipe
        {
            Slug = "test-recipe",
            Name = "Omletă cu cartofi",
            Description = "Rețetă de test",
            Category = RecipeCategory.Breakfast,
            Difficulty = Difficulty.Easy,
            PrepTimeMinutes = 20,
            Servings = 2,
            Instructions = ["Gătește ingredientele."],
            RecipeIngredients =
            [
                new RecipeIngredient { Ingredient = potatoes, Quantity = "2" },
                new RecipeIngredient { Ingredient = onion, Quantity = "1" },
                new RecipeIngredient { Ingredient = salt, Quantity = "după gust" }
            ],
            Translations =
            [
                new RecipeTranslation { LanguageCode = "en", Name = "Potato omelet", Description = "Test recipe", Instructions = ["Cook the ingredients."] },
                new RecipeTranslation { LanguageCode = "ru", Name = "Омлет с картофелем", Description = "Тестовый рецепт", Instructions = ["Приготовьте продукты."] }
            ]
        };

        var dinner = new Recipe
        {
            Slug = "other-recipe",
            Name = "Supă de ceapă",
            Description = "Altă rețetă de test",
            Category = RecipeCategory.Dinner,
            Difficulty = Difficulty.Medium,
            PrepTimeMinutes = 40,
            Servings = 3,
            Instructions = ["Fierbe ingredientele."],
            RecipeIngredients = [new RecipeIngredient { Ingredient = onion, Quantity = "2" }]
        };

        dbContext.Recipes.AddRange(breakfast, dinner);
        dbContext.SaveChanges();
    }
}
