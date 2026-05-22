using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.AuditLogs.DTOs;

public record AuditLogItemDto(
    long Id,
    DateTimeOffset CreatedAt,
    Guid UserId,
    string? UserName,
    string? UserEmail,
    string EntityType,
    Guid EntityId,
    AuditAction Action,
    string? FieldName,
    string? OldValue,
    string? NewValue,
    string? IpAddress);
