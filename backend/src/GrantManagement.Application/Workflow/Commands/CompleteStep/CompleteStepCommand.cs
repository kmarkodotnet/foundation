using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.CompleteStep;

public record CompleteStepCommand(Guid ApplicationId, WorkflowStepType StepType) : IRequest<WorkflowStepDetailDto>, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.StatusChange;
}
