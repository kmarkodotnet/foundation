using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.RevokeFoundationAdmin;

public sealed class RevokeFoundationAdminCommandHandler : IRequestHandler<RevokeFoundationAdminCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;

    public RevokeFoundationAdminCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
    }

    public async Task Handle(RevokeFoundationAdminCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var foundation = await _db.Foundations
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == request.FoundationId, cancellationToken)
            ?? throw new NotFoundException("Foundation", request.FoundationId);

        if (foundation.OwnerId != ownerId)
            throw new ForbiddenException("Ez az alapítvány más szervezethez tartozik.");

        // Last FoundationAdmin guard
        var activeAdminCount = await _db.FoundationUserAssignments
            .CountAsync(a => a.FoundationId == request.FoundationId
                             && a.IsActive
                             && a.FoundationRole == FoundationRole.FoundationAdmin, cancellationToken);

        if (activeAdminCount <= 1)
            throw new DomainException("Az utolsó FoundationAdmin szerepköre nem vonható vissza.");

        var targetUser = await _db.AppUsers
            .Include(u => u.FoundationAssignments)
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", request.TargetUserId);

        targetUser.RevokeFoundationAssignment(request.FoundationId);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "FoundationUserAssignment",
            entityId: request.TargetUserId,
            action: AuditAction.FoundationAssignmentRevoked,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId,
            foundationId: request.FoundationId));

        await _db.SaveChangesAsync(cancellationToken);
    }
}
