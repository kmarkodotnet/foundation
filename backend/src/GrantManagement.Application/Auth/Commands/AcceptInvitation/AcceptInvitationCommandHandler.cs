using System.Text.Json;
using AutoMapper;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.OwnerAdministration.Users.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Auth.Commands.AcceptInvitation;

public class AcceptInvitationCommandHandler : IRequestHandler<AcceptInvitationCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IJwtService _jwtService;
    private readonly IMapper _mapper;

    public AcceptInvitationCommandHandler(
        IApplicationDbContext context,
        IGoogleAuthService googleAuthService,
        IJwtService jwtService,
        IMapper mapper)
    {
        _context = context;
        _googleAuthService = googleAuthService;
        _jwtService = jwtService;
        _mapper = mapper;
    }

    public async Task<AuthResultDto> Handle(AcceptInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Token == request.InvitationToken, cancellationToken);

        if (invitation is null)
            throw new InvitationNotFoundException(request.InvitationToken);

        switch (invitation.Status)
        {
            case InvitationStatus.Accepted:
                throw new InvitationAlreadyAcceptedException();
            case InvitationStatus.Revoked:
                throw new InvitationRevokedException();
            case InvitationStatus.Expired:
                throw new InvitationExpiredException();
            case InvitationStatus.Pending when invitation.ExpiresAt < DateTimeOffset.UtcNow:
                invitation.MarkAsExpired();
                await _context.SaveChangesAsync(cancellationToken);
                throw new InvitationExpiredException();
        }

        var googleUser = await _googleAuthService.ExchangeCodeAsync(
            request.AuthorizationCode,
            request.RedirectUri,
            cancellationToken);

        if (!string.Equals(invitation.Email, googleUser.Email, StringComparison.OrdinalIgnoreCase))
            throw new EmailMismatchException(invitation.Email, googleUser.Email);

        var appUser = AppUser.CreateFromGoogle(
            googleUser.GoogleId,
            googleUser.Email,
            googleUser.FullName,
            googleUser.PictureUrl,
            invitation.Role);

        // Scope-aware role assignment
        switch (invitation.Scope)
        {
            case GrantManagement.Domain.Tenancy.Enums.AssignmentScope.Platform:
                if (invitation.PlatformRole.HasValue)
                    appUser.AssignPlatformRole(invitation.PlatformRole.Value);
                break;
            case GrantManagement.Domain.Tenancy.Enums.AssignmentScope.Owner:
                if (invitation.OwnerId.HasValue && invitation.OwnerRole.HasValue)
                    appUser.AssignOwnerRole(invitation.OwnerId.Value, invitation.OwnerRole.Value);
                if (!string.IsNullOrEmpty(invitation.FoundationAssignmentsJson))
                {
                    var assignments = JsonSerializer.Deserialize<List<FoundationRoleAssignment>>(
                        invitation.FoundationAssignmentsJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (assignments is not null)
                        foreach (var fa in assignments)
                            appUser.AssignToFoundation(fa.FoundationId, fa.Role, appUser.Id);
                }
                break;
            case GrantManagement.Domain.Tenancy.Enums.AssignmentScope.Foundation:
                if (invitation.FoundationId.HasValue && invitation.FoundationRole.HasValue)
                    appUser.AssignToFoundation(invitation.FoundationId.Value, invitation.FoundationRole.Value, appUser.Id);
                break;
        }

        _context.AppUsers.Add(appUser);
        invitation.Accept();
        appUser.RecordLogin(DateTimeOffset.UtcNow);

        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(appUser);
        var userProfile = _mapper.Map<UserProfileDto>(appUser);

        return new AuthResultDto(token, _jwtService.ExpiresInSeconds, userProfile);
    }
}
