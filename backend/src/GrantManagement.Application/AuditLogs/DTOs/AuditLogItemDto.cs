using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.AuditLogs.DTOs;

public class AuditLogItemDto
{
    public long Id { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public Guid UserId { get; init; }
    public string? UserName { get; init; }
    public string? UserEmail { get; init; }
    public string EntityType { get; init; } = null!;
    public Guid EntityId { get; init; }
    public string Action { get; init; } = null!;
    public string? FieldName { get; init; }
    public string? OldValue { get; init; }
    public string? NewValue { get; init; }
    public string? IpAddress { get; init; }
    public Guid? OwnerId { get; init; }
    public Guid? FoundationId { get; init; }
    public bool IsBreakGlass { get; init; }
}
