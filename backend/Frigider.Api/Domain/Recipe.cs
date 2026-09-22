namespace Frigider.Api.Domain;

public class Recipe
{
    public int Id { get; set; }

    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

    public RecipeCategory Category { get; set; }

    public int PrepTimeMinutes { get; set; }

    public Difficulty Difficulty { get; set; }

    public int Servings { get; set; }

    public List<string> Instructions { get; set; } = [];

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();

    public ICollection<RecipeTranslation> Translations { get; set; } = new List<RecipeTranslation>();
}
