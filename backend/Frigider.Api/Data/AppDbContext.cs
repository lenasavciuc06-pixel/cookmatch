using Frigider.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Frigider.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Ingredient> Ingredients => Set<Ingredient>();

    public DbSet<IngredientTranslation> IngredientTranslations => Set<IngredientTranslation>();

    public DbSet<Recipe> Recipes => Set<Recipe>();

    public DbSet<RecipeTranslation> RecipeTranslations => Set<RecipeTranslation>();

    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
