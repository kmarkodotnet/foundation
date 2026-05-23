using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Users.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Users.Queries.GetUserList;

public class GetUserListQueryHandler
    : IRequestHandler<GetUserListQuery, IReadOnlyList<UserListItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUserListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<UserListItemDto>> Handle(
        GetUserListQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.AppUsers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term));
        }

        if (request.Role.HasValue)
            query = query.Where(u => u.Role == request.Role.Value);

        return await query
            .OrderBy(u => u.Name)
            .Select(u => new UserListItemDto(
                u.Id,
                u.Email,
                u.Name,
                u.ProfilePictureUrl,
                u.Role.ToString(),
                u.Status == Domain.Entities.UserStatus.Active,
                u.CreatedAt,
                u.LastLoginAt))
            .ToListAsync(cancellationToken);
    }
}
