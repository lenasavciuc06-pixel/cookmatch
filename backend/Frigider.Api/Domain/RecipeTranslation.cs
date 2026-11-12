namespace Frigider.Api.Domain;

public class RecipeTranslation
{
    public int Id { get; set; }

    public int RecipeId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<string> Instructions { get; set; } = [];

    public Recipe Recipe { get; set; } = null!;
}
