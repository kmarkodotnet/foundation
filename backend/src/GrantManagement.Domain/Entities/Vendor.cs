using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public enum VendorStatus { Active, Inactive }

public class Vendor : AggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public TaxNumber? TaxNumber { get; private set; }
    public string? Address { get; private set; }
    public ContactInfo Contact { get; private set; } = null!;
    public VendorStatus Status { get; private set; }

    private Vendor() { }

    public static Vendor Create(
        string name,
        TaxNumber? taxNumber,
        string? address,
        ContactInfo contact)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("A szerződő cég neve kötelező.");

        return new Vendor
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            TaxNumber = taxNumber,
            Address = address?.Trim(),
            Contact = contact,
            Status = VendorStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string name,
        TaxNumber? taxNumber,
        string? address,
        ContactInfo contact)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("A szerződő cég neve kötelező.");

        Name = name.Trim();
        TaxNumber = taxNumber;
        Address = address?.Trim();
        Contact = contact;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Deactivate()
    {
        Status = VendorStatus.Inactive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Reactivate()
    {
        Status = VendorStatus.Active;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
