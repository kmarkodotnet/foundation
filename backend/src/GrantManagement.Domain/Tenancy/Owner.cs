using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy.Enums;
using GrantManagement.Domain.Tenancy.Events;

namespace GrantManagement.Domain.Tenancy;

public class Owner : AggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public string ContactEmail { get; private set; } = null!;
    public OwnerStatus Status { get; private set; }

    private Owner() { }

    public static Owner Create(string name, string contactEmail)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Az Owner neve kötelező.");
        if (string.IsNullOrWhiteSpace(contactEmail))
            throw new DomainException("Az Owner kapcsolattartó e-mailje kötelező.");

        var owner = new Owner
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            ContactEmail = contactEmail.Trim().ToLowerInvariant(),
            Status = OwnerStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        owner.RaiseDomainEvent(new OwnerProvisioned(owner.Id, owner.Name));
        return owner;
    }

    public void Suspend()
    {
        if (Status != OwnerStatus.Active)
            throw new DomainException("Csak aktív Owner függeszthető fel.");
        Status = OwnerStatus.Suspended;
        UpdatedAt = DateTimeOffset.UtcNow;
        RaiseDomainEvent(new OwnerSuspended(Id));
    }

    public void Reactivate()
    {
        if (Status != OwnerStatus.Suspended)
            throw new DomainException("Csak felfüggesztett Owner aktiválható újra.");
        Status = OwnerStatus.Active;
        UpdatedAt = DateTimeOffset.UtcNow;
        RaiseDomainEvent(new OwnerReactivated(Id));
    }

    public void Archive()
    {
        if (Status == OwnerStatus.Archived)
            throw new DomainException("Az Owner már archiválva van.");
        Status = OwnerStatus.Archived;
        UpdatedAt = DateTimeOffset.UtcNow;
        RaiseDomainEvent(new OwnerArchived(Id));
    }
}
