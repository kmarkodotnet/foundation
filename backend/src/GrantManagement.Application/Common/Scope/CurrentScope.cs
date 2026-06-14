using GrantManagement.Domain.Tenancy.Enums;

namespace GrantManagement.Application.Common.Scope;

public record CurrentScope(
    string Audience,
    Guid? OwnerId,
    Guid? FoundationId,
    PlatformRole? PlatformRole,
    OwnerRole? OwnerRole,
    IReadOnlyDictionary<Guid, FoundationRole> FoundationRoles,
    Guid? BreakGlassGrantId);
