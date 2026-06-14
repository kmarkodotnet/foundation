using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace GrantManagement.Application.OwnerAdministration.Reports.Queries.GetOwnerDashboard;

public sealed class GetOwnerDashboardQueryHandler : IRequestHandler<GetOwnerDashboardQuery, OwnerDashboardResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly IMemoryCache _cache;

    public GetOwnerDashboardQueryHandler(IApplicationDbContext db, ICurrentScopeService scope, IMemoryCache cache)
    {
        _db = db;
        _scope = scope;
        _cache = cache;
    }

    public async Task<OwnerDashboardResponse> Handle(GetOwnerDashboardQuery request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var cacheKey = $"owner_dashboard_{ownerId}";

        if (_cache.TryGetValue(cacheKey, out OwnerDashboardResponse? cached) && cached is not null)
            return cached;

        var foundations = await _db.Foundations
            .AsNoTracking()
            .Where(f => f.OwnerId == ownerId)
            .ToListAsync(cancellationToken);

        var foundationIds = foundations.Select(f => f.Id).ToList();

        var apps = await _db.Applications
            .AsNoTracking()
            .Where(a => foundationIds.Contains(a.FoundationId))
            .Select(a => new { a.FoundationId, a.Status })
            .ToListAsync(cancellationToken);

        var foundationItems = foundations.Select(f =>
        {
            var fApps = apps.Where(a => a.FoundationId == f.Id).ToList();
            var inProgress = fApps.Count(a => a.Status is ApplicationStatus.Draft or ApplicationStatus.InProgress);
            var submitted = fApps.Count(a => a.Status == ApplicationStatus.Submitted);
            var won = fApps.Count(a => a.Status is ApplicationStatus.Won or ApplicationStatus.ClosedWon);
            var lost = fApps.Count(a => a.Status is ApplicationStatus.Lost or ApplicationStatus.ClosedLost);
            var wonAmount = 0m; // Aggregate from settlement data not yet available

            return new FoundationDashboardItem(f.Id, f.Name, inProgress, won, lost, submitted, wonAmount);
        }).ToList();

        var allWonAmount = foundationItems.Sum(f => f.WonAmount);
        var allUnaccounted = 0m; // Placeholder — settlement data aggregation TBD

        var response = new OwnerDashboardResponse(allWonAmount, allUnaccounted, foundationItems);

        _cache.Set(cacheKey, response, TimeSpan.FromMinutes(5));

        return response;
    }
}
