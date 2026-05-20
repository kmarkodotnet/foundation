using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.BudgetPlan.Commands.RequestBudgetPlanApproval;

public class RequestBudgetPlanApprovalCommandHandler : IRequestHandler<RequestBudgetPlanApprovalCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public RequestBudgetPlanApprovalCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(RequestBudgetPlanApprovalCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .AsNoTracking()
            .Include(a => a.BudgetPlan)
            .ThenInclude(bp => bp!.Items)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        if (application.BudgetPlan == null)
            throw new DomainException("Nincs rögzített költési terv ehhez a pályázathoz.");

        if (!application.BudgetPlan.Items.Any())
            throw new DomainException("Jóváhagyásra küldéshez legalább egy tétel szükséges.");

        var elnokUsers = await _context.AppUsers
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Elnok)
            .ToListAsync(cancellationToken);

        foreach (var user in elnokUsers)
        {
            var notification = Notification.Create(
                user.Id,
                NotificationType.ApprovalRequired,
                "Költési terv jóváhagyása szükséges",
                $"A(z) \"{application.Title}\" pályázat költési terve jóváhagyásra vár.",
                application.Id,
                "BudgetPlan");

            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
