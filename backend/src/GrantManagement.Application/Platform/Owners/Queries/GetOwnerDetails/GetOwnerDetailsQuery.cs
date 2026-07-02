using MediatR;

namespace GrantManagement.Application.Platform.Owners.Queries.GetOwnerDetails;

public record GetOwnerDetailsQuery(Guid OwnerId) : IRequest<OwnerDetailsResponse>;

public record OwnerDetailsResponse(
    Guid Id,
    string Name,
    string ContactEmail,
    string Status,
    int ActiveFoundationsCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
