using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy.Enums;
using GrantManagement.Domain.Tenancy.Events;

namespace GrantManagement.Domain.Tenancy;

public class Foundation : AggregateRoot<Guid>
{
    public Guid OwnerId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? LogoUri { get; private set; }
    public FoundationStatus Status { get; private set; }

    private Foundation() { }

    public static Foundation Create(Guid ownerId, string name, string? logoUri = null)
    {
        if (ownerId == Guid.Empty)
            throw new DomainException("Az OwnerId kötelező.");
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Az alapítvány neve kötelező.");

        var foundation = new Foundation
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = name.Trim(),
            LogoUri = logoUri,
            Status = FoundationStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        foundation.RaiseDomainEvent(new FoundationCreated(foundation.Id, ownerId, foundation.Name));
        return foundation;
    }

    public void Rename(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new DomainException("Az alapítvány neve nem lehet üres.");
        if (Status == FoundationStatus.Archived)
            throw new DomainException("Archivált alapítvány neve nem módosítható.");
        Name = newName.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
        RaiseDomainEvent(new FoundationRenamed(Id, Name));
    }

    public void UpdateLogo(string? logoUri)
    {
        LogoUri = logoUri;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Archive()
    {
        if (Status == FoundationStatus.Archived)
            throw new DomainException("Az alapítvány már archiválva van.");
        Status = FoundationStatus.Archived;
        UpdatedAt = DateTimeOffset.UtcNow;
        RaiseDomainEvent(new FoundationArchived(Id));
    }
}
