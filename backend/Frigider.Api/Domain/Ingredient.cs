namespace Frigider.Api.Domain;

public class Ingredient
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string NormalizedName { get; set; } = string.Empty;

    public bool IsPantryStaple { get; set; }

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();

    public ICollection<IngredientTranslation> Translations { get; set; } = new List<IngredientTranslation>();
}
