using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.ApplyTemplateToFoundation;

public sealed class ApplyTemplateToFoundationCommandHandler : IRequestHandler<ApplyTemplateToFoundationCommand, ApplyTemplateToFoundationResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;

    public ApplyTemplateToFoundationCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
    }

    public async Task<ApplyTemplateToFoundationResponse> Handle(
        ApplyTemplateToFoundationCommand request,
        CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var template = await _db.OwnerCodeListTemplates
            .AsNoTracking()
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && t.OwnerId == ownerId, cancellationToken)
            ?? throw new NotFoundException("OwnerCodeListTemplate", request.TemplateId);

        var foundation = await _db.Foundations
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == request.TargetFoundationId, cancellationToken)
            ?? throw new NotFoundException("Foundation", request.TargetFoundationId);

        if (foundation.OwnerId != ownerId)
            throw new ForbiddenException("Ez az alapítvány más szervezethez tartozik.");

        // Find or create the Foundation's CodeList with matching name
        var codeList = await _db.CodeLists
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.FoundationId == request.TargetFoundationId
                                      && c.Name == template.Name
                                      && !c.IsDeleted, cancellationToken);

        if (codeList is null)
        {
            codeList = CodeList.Create(template.Name, null, false, ownerId, request.TargetFoundationId);
            _db.CodeLists.Add(codeList);
        }

        var existingCodes = codeList.Items
            .Where(i => !i.IsDeleted)
            .Select(i => i.Code)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var addedCount = 0;
        foreach (var templateItem in template.Items.Where(i => !i.IsDeleted).OrderBy(i => i.Order))
        {
            if (!existingCodes.Contains(templateItem.Value))
            {
                codeList.AddItem(templateItem.Value, templateItem.Label, null);
                addedCount++;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new ApplyTemplateToFoundationResponse(addedCount);
    }
}
