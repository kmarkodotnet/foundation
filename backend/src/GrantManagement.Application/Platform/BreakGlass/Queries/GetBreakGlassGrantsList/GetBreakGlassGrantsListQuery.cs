using MediatR;

namespace GrantManagement.Application.Platform.BreakGlass.Queries.GetBreakGlassGrantsList;

public record GetBreakGlassGrantsListQuery : IRequest<GetBreakGlassGrantsListResponse>;

public record GetBreakGlassGrantsListResponse(IReadOnlyList<BreakGlassGrantListItemResponse> Items);

public record BreakGlassGrantListItemResponse(
    Guid Id,
    Guid TargetOwnerId,
    string? TargetOwnerName,
    DateTimeOffset IssuedAt,
    DateTimeOffset ExpiresAt,
    string Status);
