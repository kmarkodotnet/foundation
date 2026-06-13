using GrantManagement.Application.Invitations.DTOs;
using MediatR;

namespace GrantManagement.Application.Invitations.Commands.RevokeInvitation;

public record RevokeInvitationCommand(Guid InvitationId) : IRequest<InvitationResponse>;
