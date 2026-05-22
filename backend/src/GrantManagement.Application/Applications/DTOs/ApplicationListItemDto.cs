using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Applications.DTOs;

public class ApplicationListItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = null!;
    public string? Identifier { get; init; }
    public string GranterName { get; init; } = null!;
    public ApplicationStatus Status { get; init; }
    public DateTimeOffset SubmissionDeadline { get; init; }
    public DateOnly? SpendingDeadline { get; init; }
    public decimal? AwardedAmount { get; init; }
    public DateTimeOffset LastModifiedAt { get; init; }

    public bool IsDeadlineWarning =>
        SubmissionDeadline > DateTimeOffset.UtcNow &&
        SubmissionDeadline <= DateTimeOffset.UtcNow.AddDays(7);

    public bool IsDeadlineCritical =>
        SubmissionDeadline < DateTimeOffset.UtcNow;

    public bool IsSpendingDeadlineWarning =>
        Status == ApplicationStatus.Won &&
        SpendingDeadline.HasValue &&
        SpendingDeadline.Value <= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
}
