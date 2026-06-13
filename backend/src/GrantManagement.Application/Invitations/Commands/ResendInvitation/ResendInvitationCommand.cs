using GrantManagement.Application.Invitations.DTOs;
using MediatR;

namespace GrantManagement.Application.Invitations.Commands.ResendInvitation;

public record ResendInvitationCommand(Guid InvitationId, string FrontendBaseUrl) : IRequest<InvitationResponse>;
