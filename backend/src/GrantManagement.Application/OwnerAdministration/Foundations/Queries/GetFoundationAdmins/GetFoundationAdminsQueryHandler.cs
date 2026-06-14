using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Users;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Queries.GetFoundationAdmins;

public sealed class GetFoundationAdminsQueryHandler : IRequestHandler<GetFoundationAdminsQuery, IReadOnlyList<FoundationAdminListItemResponse>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;

    public GetFoundationAdminsQueryHandler(IApplicationDbContext db, ICurrentScopeService scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<IReadOnlyList<FoundationAdminListItemResponse>> Handle(
        GetFoundationAdminsQuery request,
        CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var foundationExists = await _db.Foundations
            .AnyAsync(f => f.Id == request.FoundationId && f.OwnerId == ownerId, cancellationToken);
        if (!foundationExists)
            throw new NotFoundException("Foundation", request.FoundationId);

        var admins = await _db.FoundationUserAssignments
            .AsNoTracking()
            .Where(a => a.FoundationId == request.FoundationId && a.IsActive)
            .Join(_db.AppUsers.AsNoTracking(),
                a => a.AppUserId,
                u => u.Id,
                (a, u) => new FoundationAdminListItemResponse(
                    u.Id,
                    u.Email,
                    u.Name,
                    a.FoundationRole.ToString(),
                    a.AssignedAt))
            .ToListAsync(cancellationToken);

        return admins;
    }
}
