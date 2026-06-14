using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Queries.GetFoundationsList;

public sealed class GetFoundationsListQueryHandler : IRequestHandler<GetFoundationsListQuery, GetFoundationsListResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;

    public GetFoundationsListQueryHandler(IApplicationDbContext db, ICurrentScopeService scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<GetFoundationsListResponse> Handle(GetFoundationsListQuery request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var items = await _db.Foundations
            .AsNoTracking()
            .Where(f => f.OwnerId == ownerId)
            .OrderBy(f => f.Name)
            .Select(f => new FoundationListItemResponse(
                f.Id,
                f.Name,
                f.Status.ToString(),
                f.LogoUri,
                f.CreatedAt))
            .ToListAsync(cancellationToken);

        return new GetFoundationsListResponse(items);
    }
}
