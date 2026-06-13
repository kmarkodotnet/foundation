using GrantManagement.Application.Invitations.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Invitations.Commands.CreateInvitation;

public record CreateInvitationCommand(
    string Email,
    UserRole Role,
    string FrontendBaseUrl) : IRequest<InvitationResponse>;
