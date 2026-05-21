namespace GrantManagement.Domain.ValueObjects;

public sealed record SettlementParams
{
    public DateOnly SettlementDate { get; init; }
    public Guid? SettlementMethodId { get; init; }
    public string? Description { get; init; }
    public string? Notes { get; init; }
}
