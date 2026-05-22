namespace GrantManagement.Application.Vendors.DTOs;

public class VendorDto
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
}
