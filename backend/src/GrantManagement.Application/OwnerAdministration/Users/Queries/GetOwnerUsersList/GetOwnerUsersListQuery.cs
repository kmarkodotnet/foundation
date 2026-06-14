using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Users.Queries.GetOwnerUsersList;

public record GetOwnerUsersListQuery : IRequest<IReadOnlyList<OwnerUserListItemResponse>>;

public record OwnerUserListItemResponse(
    Guid UserId,
    string Email,
    string FullName,
    string? OwnerRole,
    IReadOnlyList<OwnerUserFoundationItem> Foundations);

public record OwnerUserFoundationItem(Guid FoundationId, string FoundationName, string Role);
