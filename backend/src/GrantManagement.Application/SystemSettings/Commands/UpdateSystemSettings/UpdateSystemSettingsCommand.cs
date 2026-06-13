using GrantManagement.Application.SystemSettings.DTOs;
using MediatR;

namespace GrantManagement.Application.SystemSettings.Commands.UpdateSystemSettings;

public record UpdateSystemSettingsCommand(
    int NotificationWarningDays,
    int SpendingWarningDays,
    int MaxFileSizeMb,
    string OrganizationName,
    int InvitationExpiryHours) : IRequest<SystemSettingsDto>;
