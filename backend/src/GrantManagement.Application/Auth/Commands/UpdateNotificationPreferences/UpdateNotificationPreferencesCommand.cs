using GrantManagement.Application.Auth.DTOs;
using MediatR;

namespace GrantManagement.Application.Auth.Commands.UpdateNotificationPreferences;

public sealed record UpdateNotificationPreferencesCommand(
    bool EmailOnDeadlineApproaching,
    bool EmailOnDeadlineMissed,
    bool EmailOnResultRecorded,
    bool EmailOnApprovalRequired,
    bool EmailOnNewComment,
    bool EmailOnDocumentUploaded
) : IRequest<NotificationPreferencesDto>;
