namespace GrantManagement.Domain.ValueObjects;

public sealed record NotificationPreferences
{
    public bool EmailOnDeadlineApproaching { get; init; } = true;
    public bool EmailOnDeadlineMissed { get; init; } = true;
    public bool EmailOnResultRecorded { get; init; } = true;
    public bool EmailOnApprovalRequired { get; init; } = true;
    public bool EmailOnNewComment { get; init; } = false;
    public bool EmailOnDocumentUploaded { get; init; } = false;

    public static NotificationPreferences Default => new();
    public static NotificationPreferences AllDisabled => new()
    {
        EmailOnDeadlineApproaching = false,
        EmailOnDeadlineMissed = false,
        EmailOnResultRecorded = false,
        EmailOnApprovalRequired = false,
        EmailOnNewComment = false,
        EmailOnDocumentUploaded = false
    };
}
