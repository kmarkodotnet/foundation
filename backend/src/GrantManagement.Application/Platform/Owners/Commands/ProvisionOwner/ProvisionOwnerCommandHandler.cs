using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Owners.Commands.ProvisionOwner;

public sealed class ProvisionOwnerCommandHandler : IRequestHandler<ProvisionOwnerCommand, ProvisionOwnerResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailService _emailService;
    private readonly IInvitationLinkBuilder _linkBuilder;

    public ProvisionOwnerCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IEmailService emailService,
        IInvitationLinkBuilder linkBuilder)
    {
        _db = db;
        _currentUser = currentUser;
        _emailService = emailService;
        _linkBuilder = linkBuilder;
    }

    public async Task<ProvisionOwnerResponse> Handle(ProvisionOwnerCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.InitialOwnerAdminEmail.Trim().ToLowerInvariant();

        var emailTaken = await _db.AppUsers
            .AnyAsync(u => u.Email == normalizedEmail && u.OwnerId.HasValue, cancellationToken);
        if (emailTaken)
            throw new DomainException("Ez az e-mail cím már egy másik Owner-hez tartozik.");

        var settings = await _db.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
        var expiryHours = settings?.InvitationExpiryHours ?? 72;

        var owner = Owner.Create(request.Name, request.ContactEmail);
        _db.Owners.Add(owner);

        var invitation = Invitation.CreateForScope(
            email: normalizedEmail,
            scope: AssignmentScope.Owner,
            ownerId: owner.Id,
            ownerRole: OwnerRole.OwnerAdmin,
            expiryHours: expiryHours);
        _db.Invitations.Add(invitation);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "Owner",
            entityId: owner.Id,
            action: AuditAction.OwnerProvisioned,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: owner.Id));

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "Invitation",
            entityId: invitation.Id,
            action: AuditAction.InvitationIssued,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: owner.Id));

        await _db.SaveChangesAsync(cancellationToken);

        await _emailService.SendInvitationAsync(
            normalizedEmail,
            _linkBuilder.BuildAcceptUrl(invitation.Token),
            cancellationToken);

        return new ProvisionOwnerResponse(owner.Id, owner.Name, owner.Status.ToString());
    }
}
