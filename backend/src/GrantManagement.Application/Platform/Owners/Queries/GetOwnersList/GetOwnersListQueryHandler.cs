using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Owners.Queries.GetOwnersList;

public sealed class GetOwnersListQueryHandler : IRequestHandler<GetOwnersListQuery, GetOwnersListResponse>
{
    private readonly IApplicationDbContext _db;

    public GetOwnersListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<GetOwnersListResponse> Handle(GetOwnersListQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Owners.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<OwnerStatus>(request.Status, out var statusEnum))
            query = query.Where(o => o.Status == statusEnum);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(o => o.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OwnerListItemResponse(
                o.Id,
                o.Name,
                o.ContactEmail,
                o.Status.ToString(),
                _db.Foundations.Count(f => f.OwnerId == o.Id && f.Status != FoundationStatus.Archived),
                o.CreatedAt))
            .ToListAsync(cancellationToken);

        return new GetOwnersListResponse(items, total);
    }
}
