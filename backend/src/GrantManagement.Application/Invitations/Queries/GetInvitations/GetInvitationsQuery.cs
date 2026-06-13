using GrantManagement.Application.Invitations.DTOs;
using MediatR;

namespace GrantManagement.Application.Invitations.Queries.GetInvitations;

public record GetInvitationsQuery(string? StatusFilter) : IRequest<IReadOnlyList<InvitationResponse>>;
