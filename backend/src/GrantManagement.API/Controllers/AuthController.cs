using GrantManagement.API.Common;
using GrantManagement.Application.Auth.Commands.GoogleLogin;
using GrantManagement.Application.Auth.Commands.Logout;
using GrantManagement.Application.Auth.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Authentication endpoints for Google OAuth 2.0 login.
/// </summary>
public class AuthController : ApiControllerBase
{
    /// <summary>
    /// Exchanges a Google OAuth authorization code for a JWT access token.
    /// Creates a new user account with the Megtekinto role if the user does not exist yet.
    /// </summary>
    /// <param name="command">The authorization code and redirect URI from the Google OAuth flow.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>JWT access token and user profile.</returns>
    /// <response code="200">Login successful, JWT token returned.</response>
    /// <response code="400">Validation error — empty authorization code or redirect URI.</response>
    /// <response code="401">Google code exchange failed — code is invalid or expired.</response>
    /// <response code="403">User account is inactive.</response>
    [HttpPost("google-callback")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AuthResultDto>> GoogleCallback(
        [FromBody] GoogleLoginCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command, ct);
        return Ok(result);
    }

    /// <summary>
    /// Logs out the currently authenticated user and records the logout timestamp.
    /// Token invalidation is client-side; the server records LastLogoutAt.
    /// </summary>
    /// <response code="204">Logout successful.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken ct = default)
    {
        await Sender.Send(new LogoutCommand(), ct);
        return NoContent();
    }
}
