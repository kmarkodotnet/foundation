using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces.Services;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.BreakGlass.Commands.IssueBreakGlass;

public sealed class IssueBreakGlassGrantCommandHandler : IRequestHandler<IssueBreakGlassGrantCommand, IssueBreakGlassGrantResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IJwtService _jwtService;

    public IssueBreakGlassGrantCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IJwtService jwtService)
    {
        _db = db;
        _currentUser = currentUser;
        _jwtService = jwtService;
    }

    public async Task<IssueBreakGlassGrantResponse> Handle(IssueBreakGlassGrantCommand request, CancellationToken cancellationToken)
    {
        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == request.TargetOwnerId, cancellationToken)
            ?? throw new NotFoundException("Owner", request.TargetOwnerId);

        if (owner.Status == OwnerStatus.Archived)
            throw new DomainException("Archivált Owner-hez nem lehet break-glass hozzáférést kiállítani.");

        var expiresAt = DateTimeOffset.UtcNow.AddHours(24);
        var grant = BreakGlassGrant.Issue(_currentUser.UserId, request.TargetOwnerId, request.Reason, expiresAt);
        _db.BreakGlassGrants.Add(grant);

        var platformAdmin = await _db.AppUsers.FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", _currentUser.UserId);

        var token = _jwtService.GenerateBreakGlassToken(platformAdmin, grant);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "BreakGlassGrant",
            entityId: grant.Id,
            action: AuditAction.BreakGlassAccess,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: request.TargetOwnerId));

        await _db.SaveChangesAsync(cancellationToken);

        return new IssueBreakGlassGrantResponse(grant.Id, token, grant.ExpiresAt);
    }
}
