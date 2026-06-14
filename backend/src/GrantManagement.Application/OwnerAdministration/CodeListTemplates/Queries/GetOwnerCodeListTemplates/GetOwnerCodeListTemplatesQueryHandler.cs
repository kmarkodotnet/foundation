using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Queries.GetOwnerCodeListTemplates;

public sealed class GetOwnerCodeListTemplatesQueryHandler
    : IRequestHandler<GetOwnerCodeListTemplatesQuery, IReadOnlyList<OwnerCodeListTemplateListItemResponse>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;

    public GetOwnerCodeListTemplatesQueryHandler(IApplicationDbContext db, ICurrentScopeService scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<IReadOnlyList<OwnerCodeListTemplateListItemResponse>> Handle(
        GetOwnerCodeListTemplatesQuery request,
        CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        return await _db.OwnerCodeListTemplates
            .AsNoTracking()
            .Where(t => t.OwnerId == ownerId && t.IsActive)
            .Select(t => new OwnerCodeListTemplateListItemResponse(
                t.Id,
                t.Name,
                t.Code,
                t.Items.Count))
            .ToListAsync(cancellationToken);
    }
}
