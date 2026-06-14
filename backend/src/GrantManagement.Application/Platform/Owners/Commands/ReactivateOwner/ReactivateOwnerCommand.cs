using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Platform.Owners.Commands.ReactivateOwner;

public record ReactivateOwnerCommand(Guid OwnerId) : IRequest<ReactivateOwnerResponse>, IAuditableCommand
{
    public string AuditEntityType => "Owner";
    public Guid AuditEntityId => OwnerId;
    public AuditAction AuditAction => AuditAction.OwnerReactivated;
}

public record ReactivateOwnerResponse(string Status);
