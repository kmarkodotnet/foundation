using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy.Enums;
using GrantManagement.Domain.Users;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public enum UserStatus { Active, Inactive }

public class AppUser : AggregateRoot<Guid>
{
    public string GoogleId { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string? ProfilePictureUrl { get; private set; }
    public UserRole Role { get; private set; }
    public UserStatus Status { get; private set; }
    public NotificationPreferences NotificationPrefs { get; private set; } = null!;
    public DateTimeOffset? LastLoginAt { get; private set; }
    public DateTimeOffset? LastLogoutAt { get; private set; }

    // CR2 multi-tenant fields
    public Guid? OwnerId { get; private set; }
    public PlatformRole? PlatformRole { get; private set; }
    public OwnerRole? OwnerRole { get; private set; }

    private readonly List<FoundationUserAssignment> _foundationAssignments = [];
    public IReadOnlyCollection<FoundationUserAssignment> FoundationAssignments => _foundationAssignments.AsReadOnly();

    private AppUser() { }

    public static AppUser CreateFromGoogle(
        string googleId,
        string email,
        string name,
        string? pictureUrl,
        UserRole defaultRole = UserRole.Admin)
    {
        return new AppUser
        {
            Id = Guid.NewGuid(),
            GoogleId = googleId,
            Email = email.Trim().ToLowerInvariant(),
            Name = name,
            ProfilePictureUrl = pictureUrl,
            Role = defaultRole,
            Status = UserStatus.Active,
            NotificationPrefs = NotificationPreferences.Default,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void SyncFromGoogle(string name, string? pictureUrl)
    {
        Name = name;
        ProfilePictureUrl = pictureUrl;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AssignRole(UserRole newRole)
    {
        Role = newRole;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Deactivate()
    {
        Status = UserStatus.Inactive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Reactivate()
    {
        Status = UserStatus.Active;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordLogin(DateTimeOffset loginAt)
    {
        LastLoginAt = loginAt;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateNotificationPreferences(NotificationPreferences prefs)
    {
        NotificationPrefs = prefs;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordLogout(DateTimeOffset logoutAt)
    {
        LastLogoutAt = logoutAt;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public bool IsAdmin() => Role == UserRole.Admin;
    public bool CanApprove() => Role is UserRole.Admin or UserRole.Elnok;
    public bool CanManageInvoices() => Role is UserRole.Admin or UserRole.Penzugyes;
    public bool CanWriteApplications() => Role is UserRole.Admin or UserRole.PalyazatiMunkatars;

    public void AssignPlatformRole(PlatformRole role)
    {
        if (OwnerId.HasValue || _foundationAssignments.Any(a => a.IsActive))
            throw new DomainException("A platform-szerepkör nem adható ki olyan felhasználónak, akinek Owner vagy Foundation hozzárendelése van.");
        PlatformRole = role;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AssignOwnerRole(Guid ownerId, OwnerRole role)
    {
        if (PlatformRole.HasValue)
            throw new DomainException("Platform-szerepkörrel rendelkező felhasználónak nem adható Owner-szerepkör.");
        if (OwnerId.HasValue && OwnerId != ownerId)
            throw new DomainException("A felhasználó már egy másik Owner-hez tartozik (NK-13).");
        OwnerId = ownerId;
        OwnerRole = role;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AssignToFoundation(Guid foundationId, FoundationRole role, Guid assignedByUserId)
    {
        if (PlatformRole.HasValue)
            throw new DomainException("Platform-szerepkörrel rendelkező felhasználó nem rendelhet Foundationhoz.");
        var existing = _foundationAssignments.FirstOrDefault(a => a.FoundationId == foundationId && a.IsActive);
        if (existing != null)
            throw new DomainException("A felhasználó már aktív hozzárendeléssel rendelkezik ehhez az alapítványhoz.");
        _foundationAssignments.Add(FoundationUserAssignment.Create(Id, foundationId, role, assignedByUserId));
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RevokeFoundationAssignment(Guid foundationId)
    {
        var assignment = _foundationAssignments.FirstOrDefault(a => a.FoundationId == foundationId && a.IsActive)
            ?? throw new DomainException("Nincs aktív hozzárendelés ehhez az alapítványhoz.");
        assignment.Revoke();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
