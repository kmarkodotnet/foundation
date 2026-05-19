using GrantManagement.Domain.Entities;

namespace GrantManagement.Domain.Interfaces.Services;

public interface IJwtService
{
    /// <summary>
    /// Generates a signed JWT access token for the given user.
    /// Token lifetime is configured via <c>Jwt:ExpirationHours</c>.
    /// </summary>
    string GenerateToken(AppUser user);

    /// <summary>
    /// Returns the token lifetime in seconds (e.g. 28800 for 8 hours).
    /// </summary>
    int ExpiresInSeconds { get; }
}
