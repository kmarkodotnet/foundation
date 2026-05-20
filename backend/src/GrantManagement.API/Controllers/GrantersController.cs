using GrantManagement.API.Common;
using GrantManagement.Application.Granters.Commands.CreateGranter;
using GrantManagement.Application.Granters.Commands.DeactivateGranter;
using GrantManagement.Application.Granters.Commands.UpdateGranter;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Application.Granters.Queries.GetGranterDetail;
using GrantManagement.Application.Granters.Queries.GetGranterList;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Granter (pályáztató) management endpoints.
/// </summary>
public class GrantersController : ApiControllerBase
{
    /// <summary>
    /// Returns a list of granters, optionally filtered to active only.
    /// </summary>
    /// <response code="200">List returned.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<GranterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<GranterDto>>> GetAll(
        [FromQuery] bool activeOnly = false,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetGranterListQuery(activeOnly), ct));
    }

    /// <summary>
    /// Returns the details of a granter including its linked applications.
    /// </summary>
    /// <response code="200">Granter detail returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Granter not found.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(GranterDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GranterDetailDto>> GetById(
        Guid id,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetGranterDetailQuery(id), ct));
    }

    /// <summary>
    /// Creates a new granter. Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="201">Granter created.</response>
    /// <response code="400">Validation error or duplicate name.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpPost]
    [ProducesResponseType(typeof(GranterDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<GranterDto>> Create(
        [FromBody] CreateGranterCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command, ct);
        return Created($"api/v1/granters/{result.Id}", result);
    }

    /// <summary>
    /// Updates a granter. Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Granter updated.</response>
    /// <response code="400">Validation error or duplicate name.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Granter not found.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(GranterDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GranterDto>> Update(
        Guid id,
        [FromBody] UpdateGranterCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { GranterId = id }, ct));
    }

    /// <summary>
    /// Deactivates a granter. Requires Admin role.
    /// </summary>
    /// <response code="204">Granter deactivated.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Granter not found.</response>
    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct = default)
    {
        await Sender.Send(new DeactivateGranterCommand(id), ct);
        return NoContent();
    }
}
