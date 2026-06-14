using GrantManagement.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.BreakGlass.Queries.GetBreakGlassGrantsList;

public sealed class GetBreakGlassGrantsListQueryHandler : IRequestHandler<GetBreakGlassGrantsListQuery, GetBreakGlassGrantsListResponse>
{
    private readonly IApplicationDbContext _db;

    public GetBreakGlassGrantsListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<GetBreakGlassGrantsListResponse> Handle(GetBreakGlassGrantsListQuery request, CancellationToken cancellationToken)
    {
        var grants = await _db.BreakGlassGrants
            .AsNoTracking()
            .OrderByDescending(g => g.IssuedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var ownerIds = grants.Select(g => g.TargetOwnerId).Distinct().ToList();
        var owners = await _db.Owners.AsNoTracking()
            .Where(o => ownerIds.Contains(o.Id))
            .ToDictionaryAsync(o => o.Id, o => o.Name, cancellationToken);

        var items = grants.Select(g => new BreakGlassGrantListItemResponse(
            g.Id,
            g.TargetOwnerId,
            owners.TryGetValue(g.TargetOwnerId, out var name) ? name : null,
            g.IssuedAt,
            g.ExpiresAt,
            g.Status.ToString())).ToList();

        return new GetBreakGlassGrantsListResponse(items);
    }
}
