using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Common.Interfaces;

public interface INotificationService
{
    Task CreateAndPushAsync(
        Guid userId,
        NotificationType type,
        string title,
        string body,
        Guid? relatedEntityId = null,
        string? relatedEntityType = null,
        CancellationToken cancellationToken = default);
}
