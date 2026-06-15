using System.ComponentModel.DataAnnotations;
using GrantManagement.Domain.Exceptions;

namespace GrantManagement.Domain.ValueObjects;

public sealed record EmailAddress
{
    private static readonly EmailAddressAttribute _validator = new();

    public string Value { get; }

    public EmailAddress(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Az e-mail cím nem lehet üres.");
        var normalized = value.Trim().ToLowerInvariant();
        if (!_validator.IsValid(normalized))
            throw new DomainException($"Érvénytelen e-mail cím formátum: {value}");
        Value = normalized;
    }

    public override string ToString() => Value;
}
