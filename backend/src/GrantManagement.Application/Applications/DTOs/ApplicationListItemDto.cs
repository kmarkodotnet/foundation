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

    public int WarningDays { get; init; } = 7;

    private static readonly IReadOnlySet<ApplicationStatus> ActiveStatuses =
        new HashSet<ApplicationStatus> { ApplicationStatus.Draft, ApplicationStatus.InProgress };

    public bool IsDeadlineWarning =>
        ActiveStatuses.Contains(Status) &&
        SubmissionDeadline != default &&
        SubmissionDeadline > DateTimeOffset.UtcNow &&
        SubmissionDeadline <= DateTimeOffset.UtcNow.AddDays(WarningDays);

    public bool IsDeadlineCritical =>
        ActiveStatuses.Contains(Status) &&
        SubmissionDeadline != default &&
        SubmissionDeadline < DateTimeOffset.UtcNow;

    public bool IsSpendingDeadlineWarning =>
        Status == ApplicationStatus.Won &&
        SpendingDeadline.HasValue &&
        SpendingDeadline.Value <= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
}
