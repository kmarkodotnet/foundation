using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invitations.Commands.CreateInvitation;
using GrantManagement.Application.Invitations.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invitations.Commands.RevokeInvitation;

public class RevokeInvitationCommandHandler : IRequestHandler<RevokeInvitationCommand, InvitationResponse>
{
    private readonly IApplicationDbContext _context;

    public RevokeInvitationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InvitationResponse> Handle(RevokeInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Id == request.InvitationId, cancellationToken);

        if (invitation is null)
            throw new InvitationNotFoundException(request.InvitationId);

        invitation.Revoke();
        await _context.SaveChangesAsync(cancellationToken);

        return CreateInvitationCommandHandler.ToResponse(invitation);
    }
}
