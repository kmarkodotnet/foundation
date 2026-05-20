using GrantManagement.Application.BudgetPlan.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.BudgetPlan.Queries.GetBudgetPlan;

public class GetBudgetPlanQueryHandler : IRequestHandler<GetBudgetPlanQuery, BudgetPlanDto?>
{
    private readonly IApplicationDbContext _context;

    public GetBudgetPlanQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BudgetPlanDto?> Handle(GetBudgetPlanQuery request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Include(a => a.BudgetPlan)
            .ThenInclude(bp => bp!.Items)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        if (application.BudgetPlan == null)
            return null;

        var bp = application.BudgetPlan;
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
