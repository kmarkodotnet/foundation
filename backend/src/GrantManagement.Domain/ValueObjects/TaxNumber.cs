using System.Text.RegularExpressions;

namespace GrantManagement.Domain.ValueObjects;

public sealed record TaxNumber
{
    private static readonly Regex Pattern =
        new(@"^\d{8}-\d-\d{2}$", RegexOptions.Compiled);

    public string Value { get; }
    public bool IsValid { get; }

    public TaxNumber(string value)
    {
        Value = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
        IsValid = Pattern.IsMatch(Value);
    }

    public override string ToString() => Value;
}
