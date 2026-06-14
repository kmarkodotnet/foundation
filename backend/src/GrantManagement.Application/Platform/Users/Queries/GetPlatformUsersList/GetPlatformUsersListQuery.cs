using MediatR;

namespace GrantManagement.Application.Platform.Users.Queries.GetPlatformUsersList;

public record GetPlatformUsersListQuery : IRequest<GetPlatformUsersListResponse>;

public record GetPlatformUsersListResponse(IReadOnlyList<PlatformUserListItemResponse> Items);

public record PlatformUserListItemResponse(Guid Id, string Email, string Name, string? PlatformRole, bool IsActive);
