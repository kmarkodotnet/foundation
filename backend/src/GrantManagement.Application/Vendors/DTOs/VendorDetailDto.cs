namespace GrantManagement.Application.Vendors.DTOs;

public class VendorDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public string? TaxNumber { get; init; }
    public string? Address { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string Status { get; init; } = null!;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public IReadOnlyList<VendorContractSummaryDto> Contracts { get; init; } = [];
    public VendorSummaryDto Summary { get; init; } = null!;
}

public class VendorContractSummaryDto
{
    public Guid ApplicationId { get; init; }
    public string ApplicationTitle { get; init; } = null!;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "HUF";
    public DateOnly? ContractDate { get; init; }
}

public class VendorSummaryDto
{
    public int TotalContracts { get; init; }
    public decimal TotalAmount { get; init; }
}
