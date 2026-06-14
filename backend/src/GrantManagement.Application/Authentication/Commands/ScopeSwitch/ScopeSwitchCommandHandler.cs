using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Authentication.Commands.ScopeSwitch;

public sealed class ScopeSwitchCommandHandler : IRequestHandler<ScopeSwitchCommand, ScopeSwitchResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly IJwtService _jwtService;
    private readonly ICurrentUserService _currentUser;

    public ScopeSwitchCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        IJwtService jwtService,
        ICurrentUserService currentUser)
    {
        _db = db;
        _scope = scope;
        _jwtService = jwtService;
        _currentUser = currentUser;
    }

    public async Task<ScopeSwitchResponse> Handle(ScopeSwitchCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.AppUsers
            .Include(u => u.FoundationAssignments)
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", _currentUser.UserId);

        string audience;
        Guid? targetFoundationId = request.TargetFoundationId;
        string? foundationName = null;
        Guid? ownerId = null;

        if (targetFoundationId is null)
        {
            // Switch back to Owner level
            if (!user.OwnerRole.HasValue)
                throw new ForbiddenException("Nincs Owner-szintű hatóköröd.");

            ownerId = user.OwnerId;
            audience = "owner";

            _db.AuditLogs.Add(AuditLog.Record(
                entityType: "ScopeSwitch",
                entityId: user.Id,
                action: AuditAction.ScopeSwitch,
                userId: _currentUser.UserId,
                ipAddress: _currentUser.IpAddress,
                ownerId: ownerId));
        }
        else
        {
            var assignment = user.FoundationAssignments
                .FirstOrDefault(a => a.FoundationId == targetFoundationId.Value && a.IsActive);
            if (assignment is null && !_scope.CanAccessOwner(user.OwnerId ?? Guid.Empty))
                throw new ForbiddenException("Nincs hozzáférésed ehhez az alapítványhoz.");

            var foundation = await _db.Foundations
                .FirstOrDefaultAsync(f => f.Id == targetFoundationId.Value, cancellationToken)
                ?? throw new NotFoundException("Foundation", targetFoundationId.Value);

            if (foundation.Status == GrantManagement.Domain.Tenancy.Enums.FoundationStatus.Archived)
                throw new DomainException("Archivált alapítványba nem lehet váltani.");

            if (!_scope.CanAccessOwner(foundation.OwnerId))
                throw new ForbiddenException("Ez az alapítvány más szervezethez tartozik.");

            ownerId = foundation.OwnerId;
            foundationName = foundation.Name;
            audience = "business";

            _db.AuditLogs.Add(AuditLog.Record(
                entityType: "ScopeSwitch",
                entityId: user.Id,
                action: AuditAction.ScopeSwitch,
                userId: _currentUser.UserId,
                ipAddress: _currentUser.IpAddress,
                ownerId: ownerId,
                foundationId: targetFoundationId));
        }

        await _db.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateTokenForScope(user, audience, ownerId, targetFoundationId);

        return new ScopeSwitchResponse(
            token,
            _jwtService.ExpiresInSeconds,
            audience,
            targetFoundationId,
            foundationName);
    }
}
