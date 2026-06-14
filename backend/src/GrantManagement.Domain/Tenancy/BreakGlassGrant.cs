using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy.Enums;
using GrantManagement.Domain.Tenancy.Events;

namespace GrantManagement.Domain.Tenancy;

public class BreakGlassGrant : AggregateRoot<Guid>
{
    public Guid PlatformAdminUserId { get; private set; }
    public Guid TargetOwnerId { get; private set; }
    public string Reason { get; private set; } = null!;
    public DateTimeOffset IssuedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public BreakGlassStatus Status { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }

    private const int MinReasonLength = 20;

    private BreakGlassGrant() { }

    public static BreakGlassGrant Issue(
        Guid platformAdminUserId,
        Guid targetOwnerId,
        string reason,
        DateTimeOffset expiresAt)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < MinReasonLength)
            throw new DomainException($"A break-glass indoklásnak legalább {MinReasonLength} karakter hosszúnak kell lennie.");
        if (expiresAt <= DateTimeOffset.UtcNow)
            throw new DomainException("A lejárati időnek a jövőben kell lennie.");

        var grant = new BreakGlassGrant
        {
            Id = Guid.NewGuid(),
            PlatformAdminUserId = platformAdminUserId,
            TargetOwnerId = targetOwnerId,
            Reason = reason.Trim(),
            IssuedAt = DateTimeOffset.UtcNow,
            ExpiresAt = expiresAt,
            Status = BreakGlassStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        grant.RaiseDomainEvent(new BreakGlassActivated(grant.Id, targetOwnerId));
        return grant;
    }

    public void Revoke()
    {
        if (Status != BreakGlassStatus.Active)
            throw new DomainException("Csak aktív break-glass grant vonható vissza.");
        Status = BreakGlassStatus.Revoked;
        RevokedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
        RaiseDomainEvent(new BreakGlassRevoked(Id));
    }

    public void MarkExpired()
    {
        if (Status != BreakGlassStatus.Active)
            return;
        Status = BreakGlassStatus.Expired;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public bool IsValidAt(DateTimeOffset point) =>
        Status == BreakGlassStatus.Active && ExpiresAt > point;
}
