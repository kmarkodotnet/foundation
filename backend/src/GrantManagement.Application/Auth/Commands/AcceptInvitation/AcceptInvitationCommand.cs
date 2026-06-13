using GrantManagement.Application.Auth.DTOs;
using MediatR;

namespace GrantManagement.Application.Auth.Commands.AcceptInvitation;

public record AcceptInvitationCommand(
    string AuthorizationCode,
    string RedirectUri,
    string InvitationToken) : IRequest<AuthResultDto>;
