using MediatR;

namespace GrantManagement.Application.Notifications.Commands.MarkAllNotificationsRead;

public record MarkAllNotificationsReadCommand : IRequest<Unit>;
