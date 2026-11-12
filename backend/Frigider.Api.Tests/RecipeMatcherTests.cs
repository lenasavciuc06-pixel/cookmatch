using Frigider.Api.Domain;
using Frigider.Api.Matching;

namespace Frigider.Api.Tests;

public class RecipeMatcherTests
{
    private readonly RecipeMatcher matcher = new();

    [Fact]
    public void Match_WhenAllNonStaplesAreAvailable_ReturnsCanCookNow()
    {
        var recipe = Recipe("Omletă", ("ouă", false), ("sare", true));

        var result = matcher.Match(["oua"], [recipe]).Single();

        Assert.Equal(0, result.MissingCount);
        Assert.Equal(1, result.MatchRatio);
        Assert.Equal(MatchStatus.CanCookNow, result.MatchStatus);
    }

    [Fact]
    public void Match_WhenExactlyOneNonStapleIsMissing_ReturnsOneMissing()
    {
        var recipe = Recipe("Supă", ("cartofi", false), ("ceapă", false));

        var result = matcher.Match(["cartof"], [recipe]).Single();

        Assert.Equal(1, result.MissingCount);
        Assert.Equal(0.5, result.MatchRatio);
        Assert.Equal("ceapă", result.Missing.Single().Name);
        Assert.Equal(MatchStatus.OneMissing, result.MatchStatus);
    }

    [Fact]
    public void Match_WhenOnlyMissingIngredientIsStaple_ReturnsCanCookNow()
    {
        var recipe = Recipe("Paste", ("paste", false), ("sare", true));

        var result = matcher.Match(["paste"], [recipe]).Single();

        Assert.Equal(0, result.MissingCount);
        Assert.Empty(result.Missing);
        Assert.Equal(1, result.MatchRatio);
        Assert.Equal(MatchStatus.CanCookNow, result.MatchStatus);
    }

    [Fact]
    public void Match_WithEmptyIngredientList_ReturnsAllNonStaplesAsMissing()
    {
        var recipe = Recipe("Salată", ("roșii", false), ("ulei", true));

        var result = matcher.Match([], [recipe]).Single();

        Assert.Equal(1, result.MissingCount);
        Assert.Equal(0, result.MatchRatio);
        Assert.Equal(MatchStatus.OneMissing, result.MatchStatus);
    }

    [Fact]
    public void Match_NormalizesDiacriticsAndRemovesDuplicates()
    {
        var recipe = Recipe("Omletă", ("ouă", false), ("ceapă", false));

        var result = matcher.Match(["OUĂ", "oua", "Ceapa"], [recipe]).Single();

        Assert.Equal(2, result.Matched.Count);
        Assert.Empty(result.Missing);
        Assert.Equal(MatchStatus.CanCookNow, result.MatchStatus);
    }

    [Fact]
    public void Match_WithEqualMissingCounts_UsesIngredientCountThenTimeThenName()
    {
        var slower = Recipe("A", ("ouă", false), ("ceapă", false));
        slower.PrepTimeMinutes = 30;

        var fewerIngredients = Recipe("Z", ("ouă", false));
        fewerIngredients.PrepTimeMinutes = 60;

        var faster = Recipe("B", ("ceapă", false), ("brânză", false));
        faster.PrepTimeMinutes = 10;

        var results = matcher.Match([], [slower, fewerIngredients, faster]);

        Assert.Equal(["Z", "B", "A"], results.Select(result => result.Recipe.Name));
    }

    [Fact]
    public void Match_IgnoresUserIngredientsThatAreNotUsedByAnyRecipe()
    {
        var recipe = Recipe("Omletă", ("ouă", false));

        var result = matcher.Match(["ouă", "avocado"], [recipe]).Single();

        Assert.Equal(0, result.MissingCount);
        Assert.Single(result.Matched);
        Assert.Equal(MatchStatus.CanCookNow, result.MatchStatus);
    }

    private static Recipe Recipe(string name, params (string Name, bool IsPantryStaple)[] ingredients)
    {
        var recipe = new Recipe
        {
            Name = name,
            RecipeIngredients = []
        };

        foreach (var (ingredientName, isPantryStaple) in ingredients)
        {
            recipe.RecipeIngredients.Add(new RecipeIngredient
            {
                Ingredient = new Ingredient
                {
                    Name = ingredientName,
                    NormalizedName = IngredientNormalizer.Normalize(ingredientName),
                    IsPantryStaple = isPantryStaple
                }
            });
        }

        return recipe;
    }
}