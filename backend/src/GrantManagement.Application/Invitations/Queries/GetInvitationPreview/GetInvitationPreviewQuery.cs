using MediatR;

namespace GrantManagement.Application.Invitations.Queries.GetInvitationPreview;

public record GetInvitationPreviewQuery(string Token) : IRequest<InvitationPreviewResponse>;

public record InvitationPreviewResponse(
    string Email,
    string Scope,
    string? Role,
    Guid? OwnerId,
    string? OwnerName,
    Guid? FoundationId,
    string? FoundationName,
    bool IsExpired);
