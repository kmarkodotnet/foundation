using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Users.Commands.RevokeUserFoundationAssignment;

public sealed class RevokeUserFoundationAssignmentCommandHandler : IRequestHandler<RevokeUserFoundationAssignmentCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;

    public RevokeUserFoundationAssignmentCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
    }

    public async Task Handle(RevokeUserFoundationAssignmentCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var foundationExists = await _db.Foundations
            .AnyAsync(f => f.Id == request.FoundationId && f.OwnerId == ownerId, cancellationToken);
        if (!foundationExists)
            throw new NotFoundException("Foundation", request.FoundationId);

        // Last FoundationAdmin guard
        var assignment = await _db.FoundationUserAssignments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AppUserId == request.TargetUserId
                                      && a.FoundationId == request.FoundationId
                                      && a.IsActive, cancellationToken)
            ?? throw new DomainException("Nincs aktív hozzárendelés ehhez az alapítványhoz.");

        if (assignment.FoundationRole == FoundationRole.FoundationAdmin)
        {
            var activeAdminCount = await _db.FoundationUserAssignments
                .CountAsync(a => a.FoundationId == request.FoundationId
                                 && a.IsActive
                                 && a.FoundationRole == FoundationRole.FoundationAdmin, cancellationToken);

            if (activeAdminCount <= 1)
                throw new DomainException("Az utolsó FoundationAdmin szerepköre nem vonható vissza.");
        }

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
