using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Queries.GetFoundationsList;

public record GetFoundationsListQuery : IRequest<GetFoundationsListResponse>;

public record GetFoundationsListResponse(IReadOnlyList<FoundationListItemResponse> Items);

public record FoundationListItemResponse(
    Guid Id,
    string Name,
    string Status,
    string? LogoUri,
    DateTimeOffset CreatedAt);
