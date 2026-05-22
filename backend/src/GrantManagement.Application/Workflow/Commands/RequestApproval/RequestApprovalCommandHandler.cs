using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.RequestApproval;

public class RequestApprovalCommandHandler : IRequestHandler<RequestApprovalCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public RequestApprovalCommandHandler(
        IApplicationDbContext context,
        INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Unit> Handle(RequestApprovalCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        var elnokUsers = await _context.AppUsers
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Elnok || u.Role == UserRole.Admin)
            .ToListAsync(cancellationToken);

        foreach (var user in elnokUsers)
        {
            await _notificationService.CreateAndPushAsync(
                user.Id,
                NotificationType.ApprovalRequired,
                "Beadás jóváhagyása szükséges",
                $"A(z) \"{application.Title}\" pályázat beadása jóváhagyásra vár.",
                application.Id,
                "Application",
                cancellationToken);

            if (user.NotificationPrefs.EmailOnApprovalRequired)
            {
                // Email handled by IEmailService downstream if needed
            }
        }

        return Unit.Value;
    }
}
