using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Users.Commands.AssignUserToFoundation;

public sealed class AssignUserToFoundationCommandHandler : IRequestHandler<AssignUserToFoundationCommand, AssignUserToFoundationResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;

    public AssignUserToFoundationCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
    }

    public async Task<AssignUserToFoundationResponse> Handle(AssignUserToFoundationCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var foundationExists = await _db.Foundations
            .AnyAsync(f => f.Id == request.FoundationId && f.OwnerId == ownerId, cancellationToken);
        if (!foundationExists)
            throw new NotFoundException("Foundation", request.FoundationId);

        var targetUser = await _db.AppUsers
            .Include(u => u.FoundationAssignments)
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", request.TargetUserId);

        if (targetUser.OwnerId != ownerId)
            throw new DomainException("A felhasználó más szervezethez tartozik.");

        targetUser.AssignToFoundation(request.FoundationId, request.Role, _currentUser.UserId);

        var assignment = targetUser.FoundationAssignments
            .First(a => a.FoundationId == request.FoundationId && a.IsActive);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "FoundationUserAssignment",
            entityId: assignment.Id,
            action: AuditAction.FoundationAssignmentCreated,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId,
            foundationId: request.FoundationId));

        await _db.SaveChangesAsync(cancellationToken);

        return new AssignUserToFoundationResponse(assignment.Id, targetUser.Id, request.FoundationId, request.Role.ToString());
    }
}
