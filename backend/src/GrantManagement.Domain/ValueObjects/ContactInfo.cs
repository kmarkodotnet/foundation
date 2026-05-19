namespace GrantManagement.Domain.ValueObjects;

public sealed record ContactInfo
{
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }

    public ContactInfo() { }

    public ContactInfo(string? phoneNumber, string? email)
    {
        PhoneNumber = phoneNumber?.Trim();
        Email = email?.Trim().ToLowerInvariant();
    }

    public static ContactInfo Empty => new();
}
