using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.CloseApplication;

[RequireRole(UserRole.Admin, UserRole.Elnok)]
public record CloseApplicationCommand(Guid ApplicationId) : IRequest<ApplicationDetailDto>, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.StatusChange;
}
