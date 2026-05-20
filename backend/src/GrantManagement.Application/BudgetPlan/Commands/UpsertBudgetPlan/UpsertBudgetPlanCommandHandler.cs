using GrantManagement.Application.BudgetPlan.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.BudgetPlan.Commands.UpsertBudgetPlan;

public class UpsertBudgetPlanCommandHandler : IRequestHandler<UpsertBudgetPlanCommand, BudgetPlanDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpsertBudgetPlanCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<BudgetPlanDto> Handle(UpsertBudgetPlanCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .Include(a => a.BudgetPlan)
            .ThenInclude(bp => bp!.Items)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        if (application.Status != ApplicationStatus.Won)
            throw new DomainException("Költési terv csak nyert pályázathoz rögzíthető.");

        var budgetStep = application.WorkflowSteps
            .FirstOrDefault(s => s.StepType == WorkflowStepType.BudgetPlan);
        if (budgetStep == null || budgetStep.Status != WorkflowStepStatus.Active)
            throw new DomainException("A Költési terv lépés nem szerkeszthető ebben az állapotban.");

        // Create BudgetPlan if it doesn't exist yet
        bool isNew = application.BudgetPlan == null;
        if (isNew)
            application.CreateBudgetPlan();

        var bp = application.BudgetPlan!;
        bp.UpdateNotes(request.Notes);

        // Sync items: add new, update existing, soft-delete removed
        var incomingIds = request.Items
            .Where(i => i.Id.HasValue)
            .Select(i => i.Id!.Value)
            .ToHashSet();

        var existingItems = bp.Items.ToList();

        // Remove items not in incoming list
        foreach (var existing in existingItems)
        {
            if (!incomingIds.Contains(existing.Id))
                bp.RemoveItem(existing.Id);
        }

        // Add or update incoming items
        var addedItems = new List<Domain.Entities.BudgetItem>();
        foreach (var dto in request.Items)
        {
            if (dto.Id.HasValue && existingItems.Any(e => e.Id == dto.Id.Value))
            {
                bp.UpdateItem(dto.Id.Value, dto.Name, dto.Type, dto.PlannedAmount, dto.Description, dto.SortOrder);
            }
            else
            {
                addedItems.Add(bp.AddItem(dto.Name, dto.Type, dto.PlannedAmount, dto.Description, dto.SortOrder));
            }
        }

        // EF Core tracks entities discovered via navigation with non-default Guid keys as Unchanged.
        // Explicitly mark new entities as Added to ensure INSERTs are generated.
        if (isNew)
            _context.BudgetPlans.Add(bp);
        else
            foreach (var item in addedItems)
                _context.BudgetItems.Add(item);

        await _context.SaveChangesAsync(cancellationToken);

        var awarded = application.Result?.AwardedAmount?.Amount;
        var total = bp.TotalPlanned;

        return new BudgetPlanDto
        {
            Id = bp.Id,
            ApplicationId = bp.ApplicationId,
            Notes = bp.Notes,
            TotalPlanned = total,
            AwardedAmount = awarded,
            Difference = awarded.HasValue ? awarded.Value - total : null,
            ApprovedAt = bp.ApprovedAt,
            ApprovedByUserId = bp.ApprovedByUserId,
            Items = bp.Items
                .OrderBy(i => i.SortOrder)
                .Select(i => new BudgetItemDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Type = i.Type.ToString(),
                    Description = i.Description,
                    PlannedAmount = i.PlannedAmount,
                    SortOrder = i.SortOrder,
                })
                .ToList(),
        };
    }
}
