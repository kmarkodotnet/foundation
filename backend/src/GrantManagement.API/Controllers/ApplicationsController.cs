using GrantManagement.API.Common;
using GrantManagement.Application.Applications.Commands.ArchiveApplication;
using GrantManagement.Application.Applications.Commands.CreateApplication;
using GrantManagement.Application.Applications.Commands.UpdateApplication;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Applications.Queries.GetApplicationDetail;
using GrantManagement.Application.Applications.Queries.GetApplicationList;
using GrantManagement.Application.Common.Models;
using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Grant application endpoints.
/// </summary>
public class ApplicationsController : ApiControllerBase
{
    /// <summary>
    /// Returns a paged list of grant applications with optional filtering.
    /// </summary>
    /// <response code="200">Paged list returned.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ApplicationListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<ApplicationListItemDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] ApplicationStatus[]? status = null,
        [FromQuery] Guid? granterId = null,
        CancellationToken ct = default)
    {
        var query = new GetApplicationListQuery(page, pageSize, search, status, granterId);
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>
    /// Returns the details of a single grant application.
    /// </summary>
    /// <response code="200">Application detail returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Application not found.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationDetailDto>> GetById(
        Guid id,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetApplicationDetailQuery(id), ct));
    }

    /// <summary>
    /// Creates a new grant application in Draft status with 9 auto-generated workflow steps.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="201">Application created successfully.</response>
    /// <response code="400">Validation error or inactive granter.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role (requires Admin or PalyazatiMunkatars).</response>
    /// <response code="404">Specified granter not found.</response>
    [HttpPost]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationDetailDto>> Create(
        [FromBody] CreateApplicationCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command, ct);
        return Created($"api/v1/applications/{result.Id}", result);
    }

    /// <summary>
    /// Updates the basic info and call step data of an existing application.
    /// Requires Admin, Elnok, or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Application updated successfully.</response>
    /// <response code="400">Validation error or locked application.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationDetailDto>> Update(
        Guid id,
        [FromBody] UpdateApplicationCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = id }, ct));
    }

    /// <summary>
    /// Archives a closed grant application (soft delete). Requires Admin role.
    /// </summary>
    /// <response code="204">Application archived.</response>
    /// <response code="400">Application is not in a closed state.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct = default)
    {
        await Sender.Send(new ArchiveApplicationCommand(id), ct);
        return NoContent();
    }
}
