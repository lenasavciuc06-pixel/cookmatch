using Frigider.Api.Data;
using Frigider.Api.Data.Seed;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Frigider.Api.Tests;

public class CatalogImportTests
{
    [Fact]
    public async Task RussianTranslationsAreAddedWithoutOverwritingExistingContent()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        await SeedRunner.SeedAsync(db);
        Assert.Equal(300, await db.RecipeTranslations.CountAsync(t => t.LanguageCode == "ru"));
        var recipe = await db.Recipes.Include(r => r.Translations).FirstAsync();
        var id = recipe.Id;
        recipe.Description = "Keep custom description";
        recipe.Translations.Single(t => t.LanguageCode == "en").Name = "Keep custom English";
        db.Remove(recipe.Translations.Single(t => t.LanguageCode == "ru"));
        var ingredient = await db.Ingredients.Include(i => i.Translations).FirstAsync();
        db.Remove(ingredient.Translations.Single(t => t.LanguageCode == "ru"));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        await SeedRunner.SeedAsync(db);
        await SeedRunner.SeedAsync(db);
        Assert.Equal(300, await db.RecipeTranslations.CountAsync(t => t.LanguageCode == "ru"));
        Assert.Equal(await db.Ingredients.CountAsync(), await db.IngredientTranslations.CountAsync(t => t.LanguageCode == "ru"));
        var preserved = await db.Recipes.Include(r => r.Translations).SingleAsync(r => r.Id == id);
        Assert.Equal("Keep custom description", preserved.Description);
        Assert.Equal("Keep custom English", preserved.Translations.Single(t => t.LanguageCode == "en").Name);
        Assert.All(preserved.Translations.Single(t => t.LanguageCode == "ru").Instructions, s => Assert.Contains("Внешний вид:", s));
    }
    [Fact]
    public async Task Import_IsIdempotent_AndInstructionRefreshPreservesRecipeIdentityAndCustomFields()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();
        await SeedRunner.SeedAsync(db);
        Assert.Equal(300, await db.Recipes.CountAsync());
        var ingredientCount = await db.Ingredients.CountAsync();
        var recipe = await db.Recipes.Include(r => r.Translations).FirstAsync(r => r.Slug == "omleta-cu-ceapa-si-branza");
        var id = recipe.Id;
        var instructions = recipe.Instructions.ToArray();
        recipe.Description = "Custom description to preserve";
        recipe.Instructions = ["Custom preparation"];
        recipe.Translations.Single(t => t.LanguageCode == "en").Instructions = ["Custom English preparation"];
        await db.SaveChangesAsync();

        await SeedRunner.SeedAsync(db);
        Assert.Equal("Custom preparation", recipe.Instructions.Single());
        await SeedRunner.SeedAsync(db, updateInstructions: true);
        Assert.Equal(id, recipe.Id);
        Assert.Equal("Custom description to preserve", recipe.Description);
        Assert.Equal(instructions, recipe.Instructions);
        Assert.All(recipe.Translations.Single(t => t.LanguageCode == "en").Instructions, s => Assert.Contains("Look for:", s));
        Assert.Equal(300, await db.Recipes.CountAsync());
        Assert.Equal(ingredientCount, await db.Ingredients.CountAsync());
    }
}
