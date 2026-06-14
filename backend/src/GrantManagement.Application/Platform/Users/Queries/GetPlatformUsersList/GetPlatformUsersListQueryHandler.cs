using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Users.Queries.GetPlatformUsersList;

public sealed class GetPlatformUsersListQueryHandler : IRequestHandler<GetPlatformUsersListQuery, GetPlatformUsersListResponse>
{
    private readonly IApplicationDbContext _db;

    public GetPlatformUsersListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<GetPlatformUsersListResponse> Handle(GetPlatformUsersListQuery request, CancellationToken cancellationToken)
    {
        var users = await _db.AppUsers
            .AsNoTracking()
            .Where(u => u.PlatformRole.HasValue)
            .Select(u => new PlatformUserListItemResponse(
                u.Id,
                u.Email,
                u.Name,
                u.PlatformRole.HasValue ? u.PlatformRole.Value.ToString() : null,
                u.Status == UserStatus.Active))
            .ToListAsync(cancellationToken);

        return new GetPlatformUsersListResponse(users);
    }
}
