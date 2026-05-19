namespace GrantManagement.Application.Auth.DTOs;

public sealed record NotificationPreferencesDto(
    bool EmailOnDeadlineApproaching,
    bool EmailOnDeadlineMissed,
    bool EmailOnResultRecorded,
    bool EmailOnApprovalRequired,
    bool EmailOnNewComment,
    bool EmailOnDocumentUploaded);
