using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Queries.GetOwnerCodeListTemplateDetails;

public sealed class GetOwnerCodeListTemplateDetailsQueryHandler
    : IRequestHandler<GetOwnerCodeListTemplateDetailsQuery, OwnerCodeListTemplateDetailsResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;

    public GetOwnerCodeListTemplateDetailsQueryHandler(IApplicationDbContext db, ICurrentScopeService scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<OwnerCodeListTemplateDetailsResponse> Handle(
        GetOwnerCodeListTemplateDetailsQuery request,
        CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var template = await _db.OwnerCodeListTemplates
            .AsNoTracking()
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && t.OwnerId == ownerId, cancellationToken)
            ?? throw new NotFoundException("OwnerCodeListTemplate", request.TemplateId);

        return new OwnerCodeListTemplateDetailsResponse(
            template.Id,
            template.Name,
            template.Code,
            template.Items
                .OrderBy(i => i.Order)
                .Select(i => new OwnerCodeListTemplateItemResponse(i.Id, i.Value, i.Label, i.Order))
                .ToList());
    }
}
