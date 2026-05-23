using GrantManagement.API.Common;
using GrantManagement.Application.Users.Commands.ActivateUser;
using GrantManagement.Application.Users.Commands.DeactivateUser;
using GrantManagement.Application.Users.Commands.UpdateUserRole;
using GrantManagement.Application.Users.DTOs;
using GrantManagement.Application.Users.Queries.GetUserList;
using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// User management endpoints (Admin only).
/// </summary>
[Authorize(Policy = Policies.CanManageUsers)]
public class UsersController : ApiControllerBase
{
    /// <summary>
    /// Returns all registered users, optionally filtered by name/email/role.
    /// </summary>
    /// <response code="200">User list returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<UserListItemDto>>> GetAll(
        [FromQuery] string? searchTerm = null,
        [FromQuery] UserRole? role = null,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetUserListQuery(searchTerm, role), ct));
    }

    /// <summary>
    /// Assigns a new role to a user.
    /// </summary>
    /// <response code="204">Role updated.</response>
    /// <response code="400">Last admin protection triggered.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">User not found.</response>
    [HttpPut("{id:guid}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRole(
        Guid id,
        [FromBody] UpdateUserRoleRequest body,
        CancellationToken ct = default)
    {
        await Sender.Send(new UpdateUserRoleCommand(id, body.Role), ct);
        return NoContent();
    }

    /// <summary>
    /// Deactivates a user account.
    /// </summary>
    /// <response code="204">User deactivated.</response>
    /// <response code="400">Cannot deactivate self or last admin.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">User not found.</response>
    [HttpPut("{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct = default)
    {
        await Sender.Send(new DeactivateUserCommand(id), ct);
        return NoContent();
    }

    /// <summary>
    /// Reactivates a previously deactivated user account.
    /// </summary>
    /// <response code="204">User reactivated.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">User not found.</response>
    [HttpPut("{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct = default)
    {
        await Sender.Send(new ActivateUserCommand(id), ct);
        return NoContent();
    }
}

public record UpdateUserRoleRequest(UserRole Role);
