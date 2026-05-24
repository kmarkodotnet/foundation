using MediatR;

namespace GrantManagement.Application.BudgetPlan.Commands.ApproveBudgetPlan;

public record ApproveBudgetPlanCommand(Guid ApplicationId) : IRequest<Unit>;
