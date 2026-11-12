using Frigider.Api.Data;
using Frigider.Api.Data.Seed;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Frigider.Api.Tests;

public class CatalogImportTests
{
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
