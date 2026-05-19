namespace GrantManagement.Application.Auth.DTOs;

public sealed record AuthResultDto(
    string AccessToken,
    int ExpiresIn,
    UserProfileDto User);
