using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Applications.DTOs;

public class ApplicationListItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = null!;
    public string? Identifier { get; init; }
    public ApplicationStatus Status { get; init; }
    public string GranterName { get; init; } = null!;
    public DateTimeOffset SubmissionDeadline { get; init; }
    public DateOnly? SpendingDeadline { get; init; }
    public decimal? AwardedAmount { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
