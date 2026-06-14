using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Platform.Owners.Commands.ArchiveOwner;

public record ArchiveOwnerCommand(Guid OwnerId) : IRequest<ArchiveOwnerResponse>, IAuditableCommand
{
    public string AuditEntityType => "Owner";
    public Guid AuditEntityId => OwnerId;
    public AuditAction AuditAction => AuditAction.OwnerArchived;
}

public record ArchiveOwnerResponse(string Status);
