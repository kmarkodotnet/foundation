using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.BreakGlass.Commands.RevokeBreakGlass;

public sealed class RevokeBreakGlassGrantCommandHandler : IRequestHandler<RevokeBreakGlassGrantCommand, RevokeBreakGlassGrantResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public RevokeBreakGlassGrantCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<RevokeBreakGlassGrantResponse> Handle(RevokeBreakGlassGrantCommand request, CancellationToken cancellationToken)
    {
        var grant = await _db.BreakGlassGrants.FirstOrDefaultAsync(g => g.Id == request.GrantId, cancellationToken)
            ?? throw new NotFoundException("BreakGlassGrant", request.GrantId);

        grant.Revoke();

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "BreakGlassGrant",
            entityId: grant.Id,
            action: AuditAction.BreakGlassRevoked,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: grant.TargetOwnerId));

        await _db.SaveChangesAsync(cancellationToken);

        return new RevokeBreakGlassGrantResponse(grant.Status.ToString(), grant.RevokedAt!.Value);
    }
}
