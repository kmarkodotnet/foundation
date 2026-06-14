using MediatR;
using GrantManagement.Domain.Tenancy.Enums;

namespace GrantManagement.Application.Authentication.Queries.GetAvailableScopes;

public record GetAvailableScopesQuery : IRequest<AvailableScopesResponse>;

public record AvailableScopesResponse(
    PlatformRole? PlatformRole,
    Guid? OwnerId,
    string? OwnerName,
    OwnerRole? OwnerRole,
    IReadOnlyList<FoundationScopeItem> Foundations);

public record FoundationScopeItem(Guid FoundationId, string FoundationName, string Role);
