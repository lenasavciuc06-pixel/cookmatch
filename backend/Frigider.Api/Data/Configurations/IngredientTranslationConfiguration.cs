using Frigider.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Frigider.Api.Data.Configurations;

public class IngredientTranslationConfiguration : IEntityTypeConfiguration<IngredientTranslation>
{
    public void Configure(EntityTypeBuilder<IngredientTranslation> builder)
    {
        builder.ToTable("IngredientTranslations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.LanguageCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(x => new { x.IngredientId, x.LanguageCode })
            .IsUnique();
    }
}
