using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Users.Commands.InvitePlatformUser;

public sealed class InvitePlatformUserCommandHandler : IRequestHandler<InvitePlatformUserCommand, Unit>
{
    private readonly IApplicationDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IInvitationLinkBuilder _linkBuilder;

    public InvitePlatformUserCommandHandler(
        IApplicationDbContext db,
        IEmailService emailService,
        IInvitationLinkBuilder linkBuilder)
    {
        _db = db;
        _emailService = emailService;
        _linkBuilder = linkBuilder;
    }

    public async Task<Unit> Handle(InvitePlatformUserCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _db.AppUsers
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (existingUser?.OwnerId.HasValue == true)
            throw new DomainException("Ez az e-mail cím már egy Owner/Foundation scope-hoz tartozik.");

        var existingPending = await _db.Invitations
            .AnyAsync(i => i.Email == email
                        && i.Scope == AssignmentScope.Platform
                        && i.Status == InvitationStatus.Pending, cancellationToken);
        if (existingPending)
            throw new DomainException("Erre az e-mail-re már van PENDING platform meghívó.");

        var settings = await _db.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        var invitation = Invitation.CreateForScope(
            email: email,
            scope: AssignmentScope.Platform,
            platformRole: request.Role,
            expiryHours: settings?.InvitationExpiryHours ?? 72);

        _db.Invitations.Add(invitation);
        await _db.SaveChangesAsync(cancellationToken);

        await _emailService.SendInvitationAsync(
            email,
            _linkBuilder.BuildAcceptUrl(invitation.Token),
            cancellationToken);

        return Unit.Value;
    }
}
