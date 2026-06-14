using MediatR;
using GrantManagement.Domain.Tenancy.Enums;

namespace GrantManagement.Application.Platform.Owners.Queries.GetOwnersList;

public record GetOwnersListQuery(string? Status, int Page = 1, int PageSize = 20) : IRequest<GetOwnersListResponse>;

public record GetOwnersListResponse(IReadOnlyList<OwnerListItemResponse> Items, int TotalCount);

public record OwnerListItemResponse(
    Guid Id,
    string Name,
    string ContactEmail,
    string Status,
    int FoundationsCount,
    DateTimeOffset CreatedAt);
