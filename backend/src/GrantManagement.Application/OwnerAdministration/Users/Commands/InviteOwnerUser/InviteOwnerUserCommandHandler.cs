using System.Text.Json;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Application.OwnerAdministration.Users.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Users.Commands.InviteOwnerUser;

public sealed class InviteOwnerUserCommandHandler : IRequestHandler<InviteOwnerUserCommand, InviteOwnerUserResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailService _emailService;

    public InviteOwnerUserCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser,
        IEmailService emailService)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
        _emailService = emailService;
    }

    public async Task<InviteOwnerUserResponse> Handle(InviteOwnerUserCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // NK-13: email cannot belong to another Owner
        var existingUser = await _db.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (existingUser is not null && existingUser.OwnerId.HasValue && existingUser.OwnerId != ownerId)
            throw new ConflictException("Ez az e-mail cím más szervezethez tartozik (NK-13).");

        // Validate all Foundation IDs belong to this Owner
        var foundationIds = request.FoundationAssignments.Select(a => a.FoundationId).Distinct().ToList();
        var validFoundationCount = await _db.Foundations
            .CountAsync(f => foundationIds.Contains(f.Id) && f.OwnerId == ownerId, cancellationToken);

        if (validFoundationCount != foundationIds.Count)
            throw new DomainException("Az adott alapítvány nem ehhez az Owner-hez tartozik.");

        // Check for existing pending invite for this Owner
        var existingPendingInvite = await _db.Invitations
            .AnyAsync(i => i.Email == normalizedEmail
                           && i.OwnerId == ownerId
                           && i.Status == InvitationStatus.Pending, cancellationToken);

        if (existingPendingInvite)
            throw new ConflictException("Már van függőben lévő meghívó ehhez az e-mail címhez.");

        var assignmentsJson = JsonSerializer.Serialize(request.FoundationAssignments);

        var invitation = Invitation.CreateForScope(
            email: normalizedEmail,
            scope: AssignmentScope.Owner,
            expiryHours: 72,
            ownerId: ownerId,
            ownerRole: OwnerRole.OwnerAdmin,
            foundationAssignmentsJson: assignmentsJson);

        _db.Invitations.Add(invitation);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "Invitation",
            entityId: invitation.Id,
            action: AuditAction.OwnerUserInvited,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId));

        await _db.SaveChangesAsync(cancellationToken);

        await _emailService.SendInvitationAsync(normalizedEmail, invitation.Token, cancellationToken);

        return new InviteOwnerUserResponse(invitation.Id);
    }
}
