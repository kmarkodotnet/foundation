using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.UpdateContractStep;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record UpdateContractStepCommand(
    Guid ApplicationId,
    string? ContractIdentifier,
    DateOnly? ContractDate,
    bool NotificationReceived,
    DateOnly? NotificationDate,
    bool Complete
) : IRequest<WorkflowStepDetailDto>, IApplicationCommand, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.Update;
}
