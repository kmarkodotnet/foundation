namespace GrantManagement.Domain.Interfaces.Services;

public sealed record GoogleUserInfo(
    string GoogleId,
    string Email,
    string FullName,
    string? PictureUrl);

public interface IGoogleAuthService
{
    /// <summary>
    /// Exchanges an OAuth authorization code for Google user information.
    /// Throws <see cref="UnauthorizedAccessException"/> if the code exchange fails.
    /// </summary>
    Task<GoogleUserInfo> ExchangeCodeAsync(string code, string redirectUri, CancellationToken cancellationToken = default);
}
