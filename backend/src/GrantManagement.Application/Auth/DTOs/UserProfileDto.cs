namespace GrantManagement.Application.Auth.DTOs;

public sealed record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? PictureUrl,
    string Role,
    DateTimeOffset? LastLoginAt,
    NotificationPreferencesDto NotificationPreferences);
