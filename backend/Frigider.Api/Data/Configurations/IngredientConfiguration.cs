using Frigider.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Frigider.Api.Data.Configurations;

public class IngredientConfiguration : IEntityTypeConfiguration<Ingredient>
{
    public void Configure(EntityTypeBuilder<Ingredient> builder)
    {
        builder.ToTable("Ingredients");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.NormalizedName)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(x => x.NormalizedName)
            .IsUnique();

        builder.HasIndex(x => x.IsPantryStaple);

        builder.HasMany(x => x.Translations)
            .WithOne(x => x.Ingredient)
            .HasForeignKey(x => x.IngredientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.RecipeIngredients)
            .WithOne(x => x.Ingredient)
            .HasForeignKey(x => x.IngredientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
