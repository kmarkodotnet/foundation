using GrantManagement.Application.SystemSettings.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.SystemSettings.Commands.UpdateSystemSettings;

public record UpdateSystemSettingsCommand(
    int NotificationWarningDays,
    int SpendingWarningDays,
    int MaxFileSizeMb,
    string OrganizationName,
    UserRole DefaultUserRole) : IRequest<SystemSettingsDto>;
