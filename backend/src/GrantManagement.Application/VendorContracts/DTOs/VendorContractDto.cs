namespace GrantManagement.Application.VendorContracts.DTOs;

public class VendorContractDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public Guid VendorId { get; init; }
    public string VendorName { get; init; } = null!;
    public string? ContractIdentifier { get; init; }
    public DateOnly? ContractDate { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "HUF";
    public Guid? BudgetItemId { get; init; }
    public string? BudgetItemName { get; init; }
    public string? Notes { get; init; }
    public Guid CreatedByUserId { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}
