using Frigider.Api.Matching;
using Xunit;

namespace Frigider.Api.Tests;

public class IngredientNormalizerTests
{
    public static TheoryData<string, string> IngredientPairs => new()
    {
        { "Ceapă", "ceapa" },
        { "Ceapă", "CEAPA" },
        { "ceapa", "CEAPA" },
        { "ouă", "oua" },
        { "ouă", "ou" },
        { "oua", "ou" },
        { "Cartofi", "cartof" },
        { "Cartofi", "cartofi" },
        { "cartofi", "cartof" },
        { "brânză", "branza" },
        { "branza", "BRANZA" },
        { "Brânză", "branza" },
        { "rosii", "rosie" },
        { "ROSII", "rosie" },
        { "branzeturi", "branza" },
        { "piept de pui", "pui" },
        { "PIEPT DE PUI", "pui" },
        { "de ceapă", "ceapa" },
        { "niste cartofi", "cartof" },
        { "putina rosii", "rosie" },
        { "smantana", "smantana" },
        { "Smântână", "smantana" },
        { "Castravete", "castravete" },
        { "castravete", "CASTRAVETE" },
        { "Morcovi", "morcov" },
        { "morcovi", "morcov" },
        { "pere", "pere" },
        { "mere", "mere" },
        { "de fasole", "fasole" },
        { "un pui", "pui" },
        { "o ceapa", "ceapa" },
        { "Ceapă  ", "ceapa" },
        { "  CEAPA  ", "ceapa" }
    };

    [Theory]
    [MemberData(nameof(IngredientPairs))]
    public void Normalize_GivenEquivalentIngredientNames_ProducesSameValue(string left, string right)
    {
        var leftNormalized = IngredientNormalizer.Normalize(left);
        var rightNormalized = IngredientNormalizer.Normalize(right);

        Assert.Equal(leftNormalized, rightNormalized);
        Assert.Equal(leftNormalized, IngredientNormalizer.Normalize(left));
        Assert.Equal(rightNormalized, IngredientNormalizer.Normalize(right));
    }
}
