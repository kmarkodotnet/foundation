using GrantManagement.Domain.Tenancy.Enums;

namespace GrantManagement.Application.Common.Scope;

public interface ICurrentScopeService
{
    string Audience { get; }
    Guid? OwnerId { get; }
    Guid? FoundationId { get; }
    PlatformRole? PlatformRole { get; }
    OwnerRole? OwnerRole { get; }
    IReadOnlyDictionary<Guid, FoundationRole> FoundationRoles { get; }
    Guid? BreakGlassGrantId { get; }
    bool CanAccessOwner(Guid ownerId);
    bool CanAccessFoundation(Guid foundationId);
}
