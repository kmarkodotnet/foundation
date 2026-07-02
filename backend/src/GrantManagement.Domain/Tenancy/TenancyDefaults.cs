namespace GrantManagement.Domain.Tenancy;

/// <summary>
/// A CR2 migráció (US-230) által létrehozott default tenant azonosítói.
/// A migráció előtti single-tenant adatok ez alá kerülnek besorolásra.
/// </summary>
public static class TenancyDefaults
{
    public static readonly Guid OwnerId = new("00000000-0000-0000-0000-000000000001");
    public static readonly Guid FoundationId = new("00000000-0000-0000-0000-000000000001");
}
