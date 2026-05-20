using GrantManagement.Application.BudgetPlan.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.BudgetPlan.Commands.UpsertBudgetPlan;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record UpsertBudgetPlanCommand(
    Guid ApplicationId,
    string? Notes,
    List<UpsertBudgetItemDto> Items
) : IRequest<BudgetPlanDto>, IApplicationCommand;

public record UpsertBudgetItemDto(
    Guid? Id,
    string Name,
    BudgetItemType Type,
    decimal PlannedAmount,
    string? Description,
    int SortOrder
);
