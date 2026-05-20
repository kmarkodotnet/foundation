using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Granters.DTOs;

public class GranterDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public string? Description { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public string Status { get; init; } = null!;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public IReadOnlyList<GranterApplicationDto> Applications { get; init; } = [];
}

public class GranterApplicationDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = null!;
    public string? Identifier { get; init; }
    public ApplicationStatus Status { get; init; }
    public decimal? AwardedAmount { get; init; }
}
