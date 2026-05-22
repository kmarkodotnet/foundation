using GrantManagement.Application.Notifications.DTOs;
using MediatR;

namespace GrantManagement.Application.Notifications.Queries.GetMyNotifications;

public record GetMyNotificationsQuery(bool IncludeRead = false) : IRequest<IReadOnlyList<NotificationDto>>;
