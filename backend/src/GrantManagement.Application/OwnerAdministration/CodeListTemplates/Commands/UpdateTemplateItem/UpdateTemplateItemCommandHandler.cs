using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.UpdateTemplateItem;

public sealed class UpdateTemplateItemCommandHandler : IRequestHandler<UpdateTemplateItemCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;

    public UpdateTemplateItemCommandHandler(IApplicationDbContext db, ICurrentScopeService scope, ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateTemplateItemCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var template = await _db.OwnerCodeListTemplates
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && t.OwnerId == ownerId, cancellationToken)
            ?? throw new NotFoundException("OwnerCodeListTemplate", request.TemplateId);

        template.UpdateItem(request.ItemId, request.Value, request.Label, request.Order);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "OwnerCodeListTemplate",
            entityId: template.Id,
            action: AuditAction.OwnerCodeListTemplateModified,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId));

        await _db.SaveChangesAsync(cancellationToken);
    }
}
