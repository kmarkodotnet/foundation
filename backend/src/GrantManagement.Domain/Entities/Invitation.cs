using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy.Enums;

namespace GrantManagement.Domain.Entities;

public class Invitation : BaseEntity<Guid>
{
    public string Email { get; private set; } = null!;
    public UserRole Role { get; private set; }
    public string Token { get; private set; } = null!;
    public InvitationStatus Status { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }

    // CR2 scope fields
    public AssignmentScope Scope { get; private set; }
    public Guid? OwnerId { get; private set; }
    public Guid? FoundationId { get; private set; }
    public PlatformRole? PlatformRole { get; private set; }
    public OwnerRole? OwnerRole { get; private set; }
    public FoundationRole? FoundationRole { get; private set; }
    public string? FoundationAssignmentsJson { get; private set; }

    private Invitation() { }

    public static Invitation Create(string email, UserRole role, int expiryHours)
    {
        return new Invitation
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            Role = role,
            Token = Guid.NewGuid().ToString("N"),
            Status = InvitationStatus.Pending,
            Scope = AssignmentScope.Foundation,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(expiryHours),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public static Invitation CreateForScope(
        string email,
        AssignmentScope scope,
        int expiryHours,
        Guid? ownerId = null,
        OwnerRole? ownerRole = null,
        Guid? foundationId = null,
        FoundationRole? foundationRole = null,
        PlatformRole? platformRole = null,
        string? foundationAssignmentsJson = null)
    {
        return new Invitation
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            Role = UserRole.Admin, // legacy, kept for compat
            Token = Guid.NewGuid().ToString("N"),
            Status = InvitationStatus.Pending,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(expiryHours),
            Scope = scope,
            OwnerId = ownerId,
            OwnerRole = ownerRole,
            FoundationId = foundationId,
            FoundationRole = foundationRole,
            PlatformRole = platformRole,
            FoundationAssignmentsJson = foundationAssignmentsJson,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Accept()
    {
        Status = InvitationStatus.Accepted;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Revoke()
    {
        if (Status != InvitationStatus.Pending)
            throw new DomainException("Csak PENDING státuszú meghívó vonható vissza.");
        Status = InvitationStatus.Revoked;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Resend(int expiryHours)
    {
        if (Status is InvitationStatus.Accepted or InvitationStatus.Revoked)
            throw new DomainException("Elfogadott vagy visszavont meghívó nem küldhető újra.");
        Token = Guid.NewGuid().ToString("N");
        Status = InvitationStatus.Pending;
        ExpiresAt = DateTimeOffset.UtcNow.AddHours(expiryHours);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsExpired()
    {
        Status = InvitationStatus.Expired;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
