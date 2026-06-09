using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.BudgetPlan.Commands.ApproveBudgetPlan;

public record ApproveBudgetPlanCommand(Guid ApplicationId) : IRequest<Unit>, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.Approve;
}
