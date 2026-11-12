using Frigider.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Frigider.Api.Data.Configurations;

public class RecipeIngredientConfiguration : IEntityTypeConfiguration<RecipeIngredient>
{
    public void Configure(EntityTypeBuilder<RecipeIngredient> builder)
    {
        builder.ToTable("RecipeIngredients");

        builder.HasKey(x => new { x.RecipeId, x.IngredientId });

        builder.Property(x => x.Quantity)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.IngredientId);

        builder.HasOne(x => x.Recipe)
            .WithMany(x => x.RecipeIngredients)
            .HasForeignKey(x => x.RecipeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Ingredient)
            .WithMany(x => x.RecipeIngredients)
            .HasForeignKey(x => x.IngredientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
