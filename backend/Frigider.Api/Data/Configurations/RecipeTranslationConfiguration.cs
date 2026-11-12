using Frigider.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Frigider.Api.Data.Configurations;

public class RecipeTranslationConfiguration : IEntityTypeConfiguration<RecipeTranslation>
{
    public void Configure(EntityTypeBuilder<RecipeTranslation> builder)
    {
        builder.ToTable("RecipeTranslations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.LanguageCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Description)
            .IsRequired();

        var instructionsComparer = new ValueComparer<List<string>>(
            (left, right) => left != null && right != null && left.SequenceEqual(right),
            value => value.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
            value => value.ToList());

        builder.Property(x => x.Instructions)
            .HasColumnType("TEXT")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v) ?? new List<string>())
            .Metadata.SetValueComparer(instructionsComparer);

        builder.HasIndex(x => new { x.RecipeId, x.LanguageCode })
            .IsUnique();
    }
}
