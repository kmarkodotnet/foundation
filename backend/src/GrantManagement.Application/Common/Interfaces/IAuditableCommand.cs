using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Common.Interfaces;

public interface IAuditableCommand
{
    string AuditEntityType { get; }
    Guid AuditEntityId { get; }
    AuditAction AuditAction { get; }
}
