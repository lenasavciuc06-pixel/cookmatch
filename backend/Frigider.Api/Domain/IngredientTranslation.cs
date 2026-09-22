namespace Frigider.Api.Domain;

public class IngredientTranslation
{
    public int Id { get; set; }

    public int IngredientId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Ingredient Ingredient { get; set; } = null!;
}
