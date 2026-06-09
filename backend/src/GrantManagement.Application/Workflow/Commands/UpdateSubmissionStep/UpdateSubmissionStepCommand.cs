using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.UpdateSubmissionStep;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record UpdateSubmissionStepCommand(
    Guid ApplicationId,
    DateTimeOffset SubmittedAt,
    Guid? SubmissionMethodId,
    string? ExternalIdentifier,
    string? Notes
) : IRequest<WorkflowStepDetailDto>, IApplicationCommand, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.Update;
}
