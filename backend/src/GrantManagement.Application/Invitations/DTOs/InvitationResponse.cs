namespace GrantManagement.Application.Invitations.DTOs;

public record InvitationResponse(
    Guid Id,
    string Email,
    string Role,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt);
