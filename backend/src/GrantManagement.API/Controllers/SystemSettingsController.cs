using GrantManagement.API.Common;
using GrantManagement.Application.SystemSettings.Commands.UpdateSystemSettings;
using GrantManagement.Application.SystemSettings.DTOs;
using GrantManagement.Application.SystemSettings.Queries.GetSystemSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// System configuration endpoints (Admin only).
/// </summary>
[Authorize(Policy = Policies.CanManageUsers)]
public class SystemSettingsController : ApiControllerBase
{
    /// <summary>
    /// Returns the current system settings.
    /// </summary>
    /// <response code="200">Settings returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpGet]
    [ProducesResponseType(typeof(SystemSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SystemSettingsDto>> Get(CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetSystemSettingsQuery(), ct));
    }

    /// <summary>
    /// Updates the system settings.
    /// </summary>
    /// <response code="200">Settings updated and returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut]
    [ProducesResponseType(typeof(SystemSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SystemSettingsDto>> Update(
        [FromBody] UpdateSystemSettingsCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command, ct));
    }
}
