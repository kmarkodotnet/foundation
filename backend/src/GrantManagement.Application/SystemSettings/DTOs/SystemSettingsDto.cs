namespace GrantManagement.Application.SystemSettings.DTOs;

public record SystemSettingsDto(
    int NotificationWarningDays,
    int SpendingWarningDays,
    int MaxFileSizeMb,
    string OrganizationName,
    int InvitationExpiryHours,
    DateTimeOffset UpdatedAt);
