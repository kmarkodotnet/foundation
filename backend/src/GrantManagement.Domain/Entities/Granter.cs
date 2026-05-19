using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public enum GranterStatus { Active, Inactive }

public class Granter : AggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public ContactInfo Contact { get; private set; } = null!;
    public GranterStatus Status { get; private set; }
    public byte[]? RowVersion { get; private set; }

    private Granter() { }

    public static Granter Create(string name, string? description, ContactInfo contact)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("A pályáztató neve kötelező.");

        return new Granter
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Description = description?.Trim(),
            Contact = contact,
            Status = GranterStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, string? description, ContactInfo contact)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("A pályáztató neve kötelező.");

        Name = name.Trim();
        Description = description?.Trim();
        Contact = contact;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Deactivate()
    {
        Status = GranterStatus.Inactive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Reactivate()
    {
        Status = GranterStatus.Active;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
