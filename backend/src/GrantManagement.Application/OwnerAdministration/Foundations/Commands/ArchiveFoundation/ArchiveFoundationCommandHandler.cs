using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.ArchiveFoundation;

public sealed class ArchiveFoundationCommandHandler : IRequestHandler<ArchiveFoundationCommand, ArchiveFoundationResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;
    private readonly IActiveApplicationCountService _applicationCount;

    public ArchiveFoundationCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser,
        IActiveApplicationCountService applicationCount)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
        _applicationCount = applicationCount;
    }

    public async Task<ArchiveFoundationResponse> Handle(ArchiveFoundationCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var foundation = await _db.Foundations
            .FirstOrDefaultAsync(f => f.Id == request.FoundationId, cancellationToken)
            ?? throw new NotFoundException("Foundation", request.FoundationId);

        if (foundation.OwnerId != ownerId)
            throw new ForbiddenException("Ez az alapítvány más szervezethez tartozik.");

        var activeCount = await _applicationCount.GetActiveApplicationCountAsync(request.FoundationId, cancellationToken);
        if (activeCount > 0)
            throw new DomainException($"{activeCount} aktív pályázat van; először zárd le őket.");

        foundation.Archive();

        // Bulk-deactivate all foundation user assignments
        var assignments = await _db.FoundationUserAssignments
            .Where(a => a.FoundationId == request.FoundationId && a.IsActive)
            .ToListAsync(cancellationToken);
        foreach (var assignment in assignments)
            assignment.Revoke();

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "Foundation",
            entityId: foundation.Id,
            action: AuditAction.FoundationArchived,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId,
            foundationId: foundation.Id));

        await _db.SaveChangesAsync(cancellationToken);

        return new ArchiveFoundationResponse(foundation.Status.ToString());
    }
}
