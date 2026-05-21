using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Settlement.Commands.RequestSettlementApproval;

public class RequestSettlementApprovalCommandHandler : IRequestHandler<RequestSettlementApprovalCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public RequestSettlementApprovalCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(
        RequestSettlementApprovalCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var settlementExists = await _context.Settlements
            .AsNoTracking()
            .AnyAsync(s => s.ApplicationId == request.ApplicationId, cancellationToken);

        if (!settlementExists)
            throw new DomainException("Nincs rögzített elszámolás ehhez a pályázathoz.");

        var elnokUsers = await _context.AppUsers
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Elnok)
            .ToListAsync(cancellationToken);

        foreach (var user in elnokUsers)
        {
            var notification = Notification.Create(
                user.Id,
                NotificationType.ApprovalRequired,
                "Elszámolás jóváhagyása szükséges",
                $"A(z) \"{application.Title}\" pályázat elszámolása jóváhagyásra vár.",
                application.Id,
                "Settlement");

            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
