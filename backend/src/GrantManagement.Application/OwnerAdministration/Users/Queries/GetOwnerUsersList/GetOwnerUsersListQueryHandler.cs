using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Users.Queries.GetOwnerUsersList;

public sealed class GetOwnerUsersListQueryHandler : IRequestHandler<GetOwnerUsersListQuery, IReadOnlyList<OwnerUserListItemResponse>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;

    public GetOwnerUsersListQueryHandler(IApplicationDbContext db, ICurrentScopeService scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<IReadOnlyList<OwnerUserListItemResponse>> Handle(
        GetOwnerUsersListQuery request,
        CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var foundations = await _db.Foundations
            .AsNoTracking()
            .Where(f => f.OwnerId == ownerId)
            .ToDictionaryAsync(f => f.Id, f => f.Name, cancellationToken);

        var users = await _db.AppUsers
            .AsNoTracking()
            .Include(u => u.FoundationAssignments)
            .Where(u => u.OwnerId == ownerId)
            .ToListAsync(cancellationToken);

        return users.Select(u =>
        {
            var foundationItems = u.FoundationAssignments
                .Where(a => a.IsActive && foundations.ContainsKey(a.FoundationId))
                .Select(a => new OwnerUserFoundationItem(a.FoundationId, foundations[a.FoundationId], a.FoundationRole.ToString()))
                .ToList();

            return new OwnerUserListItemResponse(
                u.Id,
                u.Email,
                u.Name,
                u.OwnerRole?.ToString(),
                foundationItems);
        }).ToList();
    }
}
