using GrantManagement.Application.BudgetPlan.DTOs;
using MediatR;

namespace GrantManagement.Application.BudgetPlan.Queries.GetBudgetPlan;

public record GetBudgetPlanQuery(Guid ApplicationId) : IRequest<BudgetPlanDto?>;
