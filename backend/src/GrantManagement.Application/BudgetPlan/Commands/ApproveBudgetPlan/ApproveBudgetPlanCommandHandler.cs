using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.BudgetPlan.Commands.ApproveBudgetPlan;

public class ApproveBudgetPlanCommandHandler : IRequestHandler<ApproveBudgetPlanCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ApproveBudgetPlanCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(ApproveBudgetPlanCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .Include(a => a.BudgetPlan)
            .ThenInclude(bp => bp!.Items)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var budgetStep = application.WorkflowSteps
            .FirstOrDefault(s => s.StepType == WorkflowStepType.BudgetPlan);

        if (budgetStep == null || budgetStep.Status != WorkflowStepStatus.Active)
            throw new DomainException("A Költési terv lépés nem jóváhagyható ebben az állapotban.");

        application.ApproveBudgetPlan(_currentUser.UserId);

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
