using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.AddTemplateItem;

public sealed class AddTemplateItemCommandHandler : IRequestHandler<AddTemplateItemCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;

    public AddTemplateItemCommandHandler(IApplicationDbContext db, ICurrentScopeService scope, ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(AddTemplateItemCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var template = await _db.OwnerCodeListTemplates
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && t.OwnerId == ownerId, cancellationToken)
            ?? throw new NotFoundException("OwnerCodeListTemplate", request.TemplateId);

        template.AddItem(request.Value, request.Label, request.Order);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "OwnerCodeListTemplate",
            entityId: template.Id,
            action: AuditAction.OwnerCodeListTemplateUpdated,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId));

        await _db.SaveChangesAsync(cancellationToken);

        return template.Items.OrderByDescending(i => i.CreatedAt).First().Id;
    }
}
