using GrantManagement.Domain.Exceptions;

namespace GrantManagement.Domain.ValueObjects;

public sealed record EmailAddress
{
    public string Value { get; }

    public EmailAddress(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Az e-mail cím nem lehet üres.");
        if (!value.Contains('@') || !value.Contains('.'))
            throw new DomainException($"Érvénytelen e-mail cím formátum: {value}");
        Value = value.Trim().ToLowerInvariant();
    }

    public override string ToString() => Value;
}
