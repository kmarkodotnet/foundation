using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Notifications.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GrantManagement.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task CreateAndPushAsync(
        Guid userId,
        NotificationType type,
        string title,
        string body,
        Guid? relatedEntityId = null,
        string? relatedEntityType = null,
        CancellationToken cancellationToken = default)
    {
        var notification = Notification.Create(userId, type, title, body, relatedEntityId, relatedEntityType);
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new NotificationDto(
            notification.Id,
            notification.Type,
            notification.Title,
            notification.Body,
            notification.RelatedEntityId,
            notification.RelatedEntityType,
            notification.IsRead,
            notification.ReadAt,
            notification.CreatedAt);

        try
        {
            await _hubContext.Clients
                .Group($"user-{userId}")
                .SendAsync("notification", dto, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR push failed for user {UserId}", userId);
        }
    }
}
