using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Tenancy.Events;

public sealed record OwnerProvisioned(Guid OwnerId, string Name) : DomainEvent;
public sealed record OwnerSuspended(Guid OwnerId) : DomainEvent;
public sealed record OwnerReactivated(Guid OwnerId) : DomainEvent;
public sealed record OwnerArchived(Guid OwnerId) : DomainEvent;
public sealed record FoundationCreated(Guid FoundationId, Guid OwnerId, string Name) : DomainEvent;
public sealed record FoundationRenamed(Guid FoundationId, string NewName) : DomainEvent;
public sealed record FoundationArchived(Guid FoundationId) : DomainEvent;
public sealed record BreakGlassActivated(Guid GrantId, Guid TargetOwnerId) : DomainEvent;
public sealed record BreakGlassRevoked(Guid GrantId) : DomainEvent;
