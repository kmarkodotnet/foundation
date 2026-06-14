using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Authentication.Queries.GetAvailableScopes;

public sealed class GetAvailableScopesQueryHandler : IRequestHandler<GetAvailableScopesQuery, AvailableScopesResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetAvailableScopesQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<AvailableScopesResponse> Handle(GetAvailableScopesQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.AppUsers
            .Include(u => u.FoundationAssignments)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", _currentUser.UserId);

        string? ownerName = null;
        if (user.OwnerId.HasValue)
        {
            var owner = await _db.Owners.AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == user.OwnerId.Value, cancellationToken);
            ownerName = owner?.Name;
        }

        var activeAssignments = user.FoundationAssignments.Where(a => a.IsActive).ToList();
        var foundationIds = activeAssignments.Select(a => a.FoundationId).ToList();
        var foundations = foundationIds.Count > 0
            ? await _db.Foundations.AsNoTracking()
                .Where(f => foundationIds.Contains(f.Id))
                .ToListAsync(cancellationToken)
            : new List<Foundation>();

        var foundationItems = activeAssignments
            .Select(a =>
            {
                var f = foundations.FirstOrDefault(x => x.Id == a.FoundationId);
                return new FoundationScopeItem(a.FoundationId, f?.Name ?? string.Empty, a.FoundationRole.ToString());
            })
            .ToList();

        return new AvailableScopesResponse(
            user.PlatformRole,
            user.OwnerId,
            ownerName,
            user.OwnerRole,
            foundationItems);
    }
}
