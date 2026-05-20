using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.BudgetPlan.Commands.RequestBudgetPlanApproval;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record RequestBudgetPlanApprovalCommand(Guid ApplicationId) : IRequest<Unit>, IApplicationCommand;
