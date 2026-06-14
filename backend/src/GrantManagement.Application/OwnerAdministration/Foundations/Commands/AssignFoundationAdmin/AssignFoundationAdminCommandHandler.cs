using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.AssignFoundationAdmin;

public sealed class AssignFoundationAdminCommandHandler : IRequestHandler<AssignFoundationAdminCommand, AssignFoundationAdminResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;

    public AssignFoundationAdminCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
    }

    public async Task<AssignFoundationAdminResponse> Handle(AssignFoundationAdminCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var foundation = await _db.Foundations
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == request.FoundationId, cancellationToken)
            ?? throw new NotFoundException("Foundation", request.FoundationId);

        if (foundation.OwnerId != ownerId)
            throw new ForbiddenException("Ez az alapítvány más szervezethez tartozik.");

        var targetUser = await _db.AppUsers
            .Include(u => u.FoundationAssignments)
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", request.TargetUserId);

        if (targetUser.OwnerId != ownerId)
            throw new DomainException("A felhasználó más szervezethez tartozik.");

        targetUser.AssignToFoundation(request.FoundationId, request.Role, _currentUser.UserId);

        var newAssignment = targetUser.FoundationAssignments
            .First(a => a.FoundationId == request.FoundationId && a.IsActive);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "FoundationUserAssignment",
            entityId: newAssignment.Id,
            action: AuditAction.FoundationAssignmentCreated,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId,
            foundationId: request.FoundationId));

        await _db.SaveChangesAsync(cancellationToken);

        return new AssignFoundationAdminResponse(newAssignment.Id, targetUser.Id, request.Role.ToString());
    }
}
