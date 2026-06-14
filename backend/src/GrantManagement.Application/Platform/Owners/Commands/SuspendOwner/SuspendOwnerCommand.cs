using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Platform.Owners.Commands.SuspendOwner;

public record SuspendOwnerCommand(Guid OwnerId) : IRequest<SuspendOwnerResponse>, IAuditableCommand
{
    public string AuditEntityType => "Owner";
    public Guid AuditEntityId => OwnerId;
    public AuditAction AuditAction => AuditAction.OwnerSuspended;
}

public record SuspendOwnerResponse(string Status);
