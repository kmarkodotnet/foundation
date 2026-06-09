using GrantManagement.API.Common;
using GrantManagement.Application.Auth.Commands.GoogleLogin;
using GrantManagement.Application.Auth.Commands.Logout;
using GrantManagement.Application.Auth.Commands.TestLogin;
using GrantManagement.Application.Auth.Commands.UpdateNotificationPreferences;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Auth.Queries.GetCurrentUser;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Authentication and current-user endpoints.
/// </summary>
public class AuthController : ApiControllerBase
{
    private readonly IWebHostEnvironment _env;

    public AuthController(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// Issues a real JWT for a named test user without Google OAuth.
    /// Only available in the Development environment — returns 404 in Production.
    /// </summary>
    /// <param name="command">Test user identity and role.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">JWT issued.</response>
    /// <response code="404">Not available outside Development.</response>
    [HttpPost("test-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthResultDto>> TestLogin(
        [FromBody] TestLoginCommand command,
        CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var result = await Sender.Send(command, ct);
        return Ok(result);
    }

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
    /// Returns the current authenticated user's profile data including notification preferences.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The current user's profile.</returns>
    /// <response code="200">Profile returned successfully.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUser(CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetCurrentUserQuery(), ct);
        return Ok(result);
    }

    /// <summary>
    /// Updates the current user's email notification preferences.
    /// </summary>
    /// <param name="command">The new notification preference values.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The updated notification preferences.</returns>
    /// <response code="200">Preferences updated successfully.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpPut("me/notification-preferences")]
    [Authorize]
    [ProducesResponseType(typeof(NotificationPreferencesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<NotificationPreferencesDto>> UpdateNotificationPreferences(
        [FromBody] UpdateNotificationPreferencesCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command, ct);
        return Ok(result);
    }

    /// <summary>
    /// Logs out the currently authenticated user and records the logout timestamp.
    /// Token invalidation is client-side; the server records LastLogoutAt.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
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
