using GrantManagement.Domain.Exceptions;

namespace GrantManagement.Domain.ValueObjects;

public enum ApplicationOutcome { Won, Lost }

public sealed record ApplicationResult
{
    public ApplicationOutcome Outcome { get; private init; }
    public DateOnly ResultDate { get; private init; }
    public string? ResultIdentifier { get; private init; }
    public decimal? AwardedAmountValue { get; private init; }
    public string? AwardedAmountCurrency { get; private init; }

    public Money? AwardedAmount => AwardedAmountValue.HasValue
        ? new Money(AwardedAmountValue.Value, AwardedAmountCurrency ?? "HUF")
        : null;

    private ApplicationResult() { }

    public static ApplicationResult Won(
        DateOnly resultDate,
        Money awardedAmount,
        string? resultIdentifier = null)
    {
        if (awardedAmount.Amount <= 0)
            throw new DomainException("A nyertes pályázat összege pozitív kell legyen.");

        return new ApplicationResult
        {
            Outcome = ApplicationOutcome.Won,
            ResultDate = resultDate,
            AwardedAmountValue = awardedAmount.Amount,
            AwardedAmountCurrency = awardedAmount.Currency,
            ResultIdentifier = resultIdentifier
        };
    }

    public static ApplicationResult Lost(
        DateOnly resultDate,
        string? resultIdentifier = null)
    {
        return new ApplicationResult
        {
            Outcome = ApplicationOutcome.Lost,
            ResultDate = resultDate,
            ResultIdentifier = resultIdentifier
        };
    }
}
