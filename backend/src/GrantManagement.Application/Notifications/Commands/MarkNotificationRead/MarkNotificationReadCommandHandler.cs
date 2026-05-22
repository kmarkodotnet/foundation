using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Notifications.Commands.MarkNotificationRead;

public class MarkNotificationReadCommandHandler
    : IRequestHandler<MarkNotificationReadCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public MarkNotificationReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(
        MarkNotificationReadCommand request,
        CancellationToken cancellationToken)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(
                n => n.Id == request.NotificationId && n.UserId == _currentUser.UserId,
                cancellationToken)
            ?? throw new NotFoundException("Notification", request.NotificationId);

        if (!notification.IsRead)
        {
            notification.MarkAsRead();
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Unit.Value;
    }
}
