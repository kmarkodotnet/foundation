namespace GrantManagement.Application.Users.DTOs;

public record UserListItemDto(
    Guid Id,
    string Email,
    string Name,
    string? ProfilePictureUrl,
    string Role,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt);
