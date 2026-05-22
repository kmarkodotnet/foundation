using MediatR;

namespace GrantManagement.Application.Notifications.Commands.MarkNotificationRead;

public record MarkNotificationReadCommand(Guid NotificationId) : IRequest<Unit>;
