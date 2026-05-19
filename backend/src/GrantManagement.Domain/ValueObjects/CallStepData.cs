namespace GrantManagement.Domain.ValueObjects;

public sealed record CallStepData
{
    public string? Description { get; init; }
    public Guid? ApplicationTypeId { get; init; }
    public decimal? MinAmountValue { get; init; }
    public string? MinAmountCurrency { get; init; }
    public decimal? MaxAmountValue { get; init; }
    public string? MaxAmountCurrency { get; init; }
    public DateTimeOffset SubmissionDeadline { get; init; }
    public DateOnly? SpendingDeadline { get; init; }
    public string? OtherMetadata { get; init; }

    public Money? MinAmount => MinAmountValue.HasValue
        ? new Money(MinAmountValue.Value, MinAmountCurrency ?? "HUF")
        : null;

    public Money? MaxAmount => MaxAmountValue.HasValue
        ? new Money(MaxAmountValue.Value, MaxAmountCurrency ?? "HUF")
        : null;
}
