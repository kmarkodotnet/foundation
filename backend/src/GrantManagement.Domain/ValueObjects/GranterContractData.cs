namespace GrantManagement.Domain.ValueObjects;

public sealed record GranterContractData
{
    public string? ContractIdentifier { get; init; }
    public DateOnly? ContractDate { get; init; }
    public bool NotificationReceived { get; init; }
    public DateOnly? NotificationDate { get; init; }
}
