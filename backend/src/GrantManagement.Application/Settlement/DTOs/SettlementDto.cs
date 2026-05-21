namespace GrantManagement.Application.Settlement.DTOs;

public class SettlementDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public DateOnly SettlementDate { get; init; }
    public Guid? SettlementMethodId { get; init; }
    public string? Description { get; init; }
    public string? Notes { get; init; }
    public decimal InvoiceCoveragePercent { get; init; }
    public bool HasLowCoverageWarning { get; init; }
    public DateTimeOffset? ApprovedAt { get; init; }
    public Guid? ApprovedByUserId { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
