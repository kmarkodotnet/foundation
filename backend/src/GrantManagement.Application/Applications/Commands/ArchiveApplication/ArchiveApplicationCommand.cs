using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Applications.Commands.ArchiveApplication;

[RequireRole(UserRole.Admin)]
public record ArchiveApplicationCommand(Guid ApplicationId) : IRequest<Unit>, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.Delete;
}
