using GrantManagement.Domain.Enums;

namespace GrantManagement.Domain.Entities;

public class AuditLog
{
    public long Id { get; private set; }
    public string EntityType { get; private set; } = null!;
    public Guid EntityId { get; private set; }
    public AuditAction Action { get; private set; }
    public string? FieldName { get; private set; }
    public string? OldValue { get; private set; }
    public string? NewValue { get; private set; }
    public Guid UserId { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private AuditLog() { }

    public static AuditLog Record(
        string entityType,
        Guid entityId,
        AuditAction action,
        Guid userId,
        string? ipAddress,
        string? fieldName = null,
        string? oldValue = null,
        string? newValue = null)
    {
        return new AuditLog
        {
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            UserId = userId,
            IpAddress = ipAddress,
            FieldName = fieldName,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
