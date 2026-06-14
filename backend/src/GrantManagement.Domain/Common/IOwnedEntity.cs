namespace GrantManagement.Domain.Common;

public interface IOwnedEntity
{
    Guid OwnerId { get; }
    Guid FoundationId { get; }
}
