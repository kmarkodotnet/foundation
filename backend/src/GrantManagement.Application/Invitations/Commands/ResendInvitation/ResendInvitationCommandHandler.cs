using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invitations.Commands.CreateInvitation;
using GrantManagement.Application.Invitations.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invitations.Commands.ResendInvitation;

public class ResendInvitationCommandHandler : IRequestHandler<ResendInvitationCommand, InvitationResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ICurrentUserService _currentUser;

    public ResendInvitationCommandHandler(
        IApplicationDbContext context,
        IEmailService emailService,
        ICurrentUserService currentUser)
    {
        _context = context;
        _emailService = emailService;
        _currentUser = currentUser;
    }

    public async Task<InvitationResponse> Handle(ResendInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Id == request.InvitationId, cancellationToken);

        if (invitation is null)
            throw new InvitationNotFoundException(request.InvitationId);

        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        var expiryHours = settings?.InvitationExpiryHours ?? 72;

        invitation.Resend(expiryHours);

        _context.AuditLogs.Add(AuditLog.Record(
            entityType: "Invitation",
            entityId: invitation.Id,
            action: AuditAction.InvitationResent,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress));

        await _context.SaveChangesAsync(cancellationToken);

        var invitationUrl = $"{request.FrontendBaseUrl.TrimEnd('/')}/invite/{invitation.Token}";
        await _emailService.SendInvitationAsync(invitation.Email, invitationUrl, cancellationToken);

        return CreateInvitationCommandHandler.ToResponse(invitation);
    }
}
