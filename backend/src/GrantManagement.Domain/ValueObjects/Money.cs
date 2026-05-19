using GrantManagement.Domain.Exceptions;

namespace GrantManagement.Domain.ValueObjects;

public sealed record Money
{
    public decimal Amount { get; }
    public string Currency { get; } = "HUF";

    public Money(decimal amount, string currency = "HUF")
    {
        if (amount < 0)
            throw new DomainException("A pénzösszeg nem lehet negatív.");
        if (string.IsNullOrWhiteSpace(currency))
            throw new DomainException("A devizanem megadása kötelező.");
        Amount = amount;
        Currency = currency.ToUpperInvariant();
    }

    public static Money Zero => new(0, "HUF");
    public static Money FromHuf(decimal amount) => new(amount, "HUF");

    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Subtract(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount - other.Amount, Currency);
    }

    public bool IsGreaterThan(Money other)
    {
        EnsureSameCurrency(other);
        return Amount > other.Amount;
    }

    public decimal PercentageOf(Money total)
    {
        if (total.Amount == 0) return 0;
        return Amount / total.Amount * 100;
    }

    private void EnsureSameCurrency(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException($"Devizanem eltérés: {Currency} vs {other.Currency}");
    }

    public override string ToString() => $"{Amount:N0} {Currency}";
}
