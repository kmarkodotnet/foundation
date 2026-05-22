using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Notifications.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQueryHandler
    : IRequestHandler<GetMyNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyNotificationsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<NotificationDto>> Handle(
        GetMyNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (!request.IncludeRead)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderBy(n => n.IsRead)
            .ThenByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(
                n.Id,
                n.Type,
                n.Title,
                n.Body,
                n.RelatedEntityId,
                n.RelatedEntityType,
                n.IsRead,
                n.ReadAt,
                n.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
