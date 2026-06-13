using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invitations.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invitations.Commands.CreateInvitation;

public class CreateInvitationCommandHandler : IRequestHandler<CreateInvitationCommand, InvitationResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public CreateInvitationCommandHandler(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<InvitationResponse> Handle(CreateInvitationCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var hasPending = await _context.Invitations
            .AsNoTracking()
            .AnyAsync(i => i.Email == normalizedEmail && i.Status == InvitationStatus.Pending, cancellationToken);

        if (hasPending)
            throw new InvitationAlreadyExistsException(normalizedEmail);

        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        var expiryHours = settings?.InvitationExpiryHours ?? 72;

        var invitation = Invitation.Create(normalizedEmail, request.Role, expiryHours);
        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync(cancellationToken);

        var invitationUrl = $"{request.FrontendBaseUrl.TrimEnd('/')}/invite/{invitation.Token}";
        await _emailService.SendInvitationAsync(invitation.Email, invitationUrl, cancellationToken);

        return ToResponse(invitation);
    }

    internal static InvitationResponse ToResponse(Invitation invitation) => new(
        invitation.Id,
        invitation.Email,
        invitation.Role.ToString(),
        invitation.Status.ToString().ToUpperInvariant(),
        invitation.CreatedAt,
        invitation.ExpiresAt);
}
