using MediatR;

namespace GrantManagement.Application.Platform.Settings.Queries.GetPlatformSettings;

public record GetPlatformSettingsQuery : IRequest<PlatformSettingsDto>;

public record PlatformSettingsDto(
    Guid Id,
    int MaxFileSizeMb,
    int InvitationExpiryHours,
    int DefaultDeadlineNotificationDays,
    Guid? DefaultOwnerCodeListTemplateId);
