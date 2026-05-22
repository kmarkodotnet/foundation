using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Notifications.DTOs;

public record NotificationDto(
    Guid Id,
    NotificationType Type,
    string Title,
    string Body,
    Guid? RelatedEntityId,
    string? RelatedEntityType,
    bool IsRead,
    DateTimeOffset? ReadAt,
    DateTimeOffset CreatedAt);
