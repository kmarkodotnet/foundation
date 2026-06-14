using GrantManagement.Domain.Common;
using GrantManagement.Domain.Tenancy.Enums;

namespace GrantManagement.Domain.Users;

public class FoundationUserAssignment : BaseEntity<Guid>
{
    public Guid AppUserId { get; private set; }
    public Guid FoundationId { get; private set; }
    public FoundationRole FoundationRole { get; private set; }
    public DateTimeOffset AssignedAt { get; private set; }
    public Guid AssignedByUserId { get; private set; }
    public bool IsActive { get; private set; }

    private FoundationUserAssignment() { }

    public static FoundationUserAssignment Create(
        Guid appUserId,
        Guid foundationId,
        FoundationRole role,
        Guid assignedByUserId)
    {
        return new FoundationUserAssignment
        {
            Id = Guid.NewGuid(),
            AppUserId = appUserId,
            FoundationId = foundationId,
            FoundationRole = role,
            AssignedAt = DateTimeOffset.UtcNow,
            AssignedByUserId = assignedByUserId,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Revoke()
    {
        IsActive = false;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
