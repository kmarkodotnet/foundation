using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.RequestApproval;

public class RequestApprovalCommandHandler : IRequestHandler<RequestApprovalCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public RequestApprovalCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(RequestApprovalCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        var elnokUsers = await _context.AppUsers
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Elnok)
            .ToListAsync(cancellationToken);

        foreach (var user in elnokUsers)
        {
            var notification = Notification.Create(
                user.Id,
                NotificationType.ApprovalRequired,
                "Beadás jóváhagyása szükséges",
                $"A(z) \"{application.Title}\" pályázat beadása jóváhagyásra vár.",
                application.Id,
                "Application");

            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
