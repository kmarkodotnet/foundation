using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invitations.Commands.CreateInvitation;
using GrantManagement.Application.Invitations.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invitations.Commands.RevokeInvitation;

public class RevokeInvitationCommandHandler : IRequestHandler<RevokeInvitationCommand, InvitationResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RevokeInvitationCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<InvitationResponse> Handle(RevokeInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Id == request.InvitationId, cancellationToken);

        if (invitation is null)
            throw new InvitationNotFoundException(request.InvitationId);

        invitation.Revoke();

        _context.AuditLogs.Add(AuditLog.Record(
            entityType: "Invitation",
            entityId: invitation.Id,
            action: AuditAction.InvitationRevoked,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress));

        await _context.SaveChangesAsync(cancellationToken);

        return CreateInvitationCommandHandler.ToResponse(invitation);
    }
}
