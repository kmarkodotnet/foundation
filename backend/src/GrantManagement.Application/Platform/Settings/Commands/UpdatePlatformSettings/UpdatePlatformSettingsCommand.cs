using MediatR;

namespace GrantManagement.Application.Platform.Settings.Commands.UpdatePlatformSettings;

public record UpdatePlatformSettingsCommand(
    int? MaxFileSizeMb,
    int? InvitationExpiryHours,
    int? DefaultDeadlineNotificationDays,
    Guid? DefaultOwnerCodeListTemplateId) : IRequest<UpdatePlatformSettingsResponse>;

public record UpdatePlatformSettingsResponse(
    Guid Id,
    int MaxFileSizeMb,
    int InvitationExpiryHours,
    int DefaultDeadlineNotificationDays,
    Guid? DefaultOwnerCodeListTemplateId);
