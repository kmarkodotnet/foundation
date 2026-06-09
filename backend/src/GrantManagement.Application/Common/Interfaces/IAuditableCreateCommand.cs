using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Common.Interfaces;

public interface IAuditableCreateCommand<TResponse>
{
    string AuditEntityType { get; }
    AuditAction AuditAction { get; }
    Guid GetEntityId(TResponse response);
}
