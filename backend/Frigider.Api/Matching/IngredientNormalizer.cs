using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Frigider.Api.Matching;

public static partial class IngredientNormalizer
{
    private static readonly IReadOnlyList<string> LeadingFillers =
    [
        "de",
        "un",
        "o",
        "niste",
        "putin",
        "putina"
    ];

    private static readonly IReadOnlyList<(string Suffix, Func<string, string> Replacement)> SingularizationRules =
    [
        ("uri", word => word[..^3]),
        ("ele", word => word[..^3] + "ea"),
        ("ile", word => word[..^3] + "a"),
        ("ii", word => word[..^2] + "ie"),
        ("e", word => IsFinalConsonantRuleApplicable(word) ? word[..^1] : word),
        ("i", word => IsFinalIConsonantRuleApplicable(word) ? word[..^1] : word)
    ];

    private static readonly IReadOnlyDictionary<string, string> SynonymsAndExceptions =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["oua"] = "ou",
            ["ouă"] = "ou",
            ["rosii"] = "rosie",
            ["cartofi"] = "cartof",
            ["branza"] = "branza",
            ["branzeturi"] = "branza",
            ["piept de pui"] = "pui",
            ["smantana"] = "smantana"
        };

    public static string Normalize(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return string.Empty;
        }

        var value = raw.Trim();
        value = Regex.Replace(value, @"\s+", " ");
        value = value.ToLowerInvariant();
        value = RemoveDiacritics(value);

        if (SynonymsAndExceptions.TryGetValue(value, out var exceptionValue))
        {
            return exceptionValue;
        }

        value = RemoveLeadingFillers(value);

        if (SynonymsAndExceptions.TryGetValue(value, out var exceptionAfterFillers))
        {
            return exceptionAfterFillers;
        }

        var words = value
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(SingularizeWord)
            .ToArray();

        value = string.Join(' ', words);
        value = Regex.Replace(value, @"[^a-z ]", string.Empty);
        value = Regex.Replace(value, @"\s+", " ").Trim();

        return value;
    }

    private static string RemoveDiacritics(string input)
    {
        var normalized = input.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var character in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static string RemoveLeadingFillers(string input)
    {
        var words = input
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        while (words.Length > 0 && LeadingFillers.Contains(words[0], StringComparer.Ordinal))
        {
            words = words[1..];
        }

        return string.Join(' ', words);
    }

    private static string SingularizeWord(string word)
    {
        if (string.IsNullOrWhiteSpace(word))
        {
            return word;
        }

        foreach (var (suffix, replacement) in SingularizationRules)
        {
            if (!word.EndsWith(suffix, StringComparison.Ordinal))
            {
                continue;
            }

            var singularized = replacement(word);
            if (!string.Equals(singularized, word, StringComparison.Ordinal))
            {
                return singularized;
            }
        }

        return word;
    }

    private static bool IsFinalConsonantRuleApplicable(string word)
    {
        return word.Length > 1
            && word[^1] == 'e'
            && word.Length > 1
            && !IsVowel(word[^2]);
    }

    private static bool IsFinalIConsonantRuleApplicable(string word)
    {
        return word.Length > 1
            && word[^1] == 'i'
            && !IsVowel(word[^2]);
    }

    private static bool IsVowel(char character)
    {
        return character is 'a' or 'e' or 'i' or 'o' or 'u';
    }
}
