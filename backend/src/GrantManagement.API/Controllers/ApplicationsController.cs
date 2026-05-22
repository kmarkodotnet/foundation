using GrantManagement.API.Common;
using GrantManagement.Application.Applications.Commands.ArchiveApplication;
using GrantManagement.Application.Applications.Commands.CreateApplication;
using GrantManagement.Application.Applications.Commands.UpdateApplication;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Applications.Queries.ExportApplications;
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
    /// Returns a paged, filtered and sorted list of grant applications.
    /// </summary>
    /// <response code="200">Paged list returned.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ApplicationListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<ApplicationListItemDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? granterId = null,
        [FromQuery] Guid? applicationTypeId = null,
        [FromQuery] ApplicationStatus[]? statuses = null,
        [FromQuery] DateOnly? submissionDeadlineFrom = null,
        [FromQuery] DateOnly? submissionDeadlineTo = null,
        [FromQuery] decimal? awardedAmountMin = null,
        [FromQuery] decimal? awardedAmountMax = null,
        [FromQuery] bool includeArchived = false,
        [FromQuery] ApplicationSortBy sortBy = ApplicationSortBy.SubmissionDeadline,
        [FromQuery] SortDirection sortDirection = SortDirection.Asc,
        CancellationToken ct = default)
    {
        var query = new GetApplicationListQuery(
            page, pageSize, searchTerm, granterId, applicationTypeId,
            statuses, submissionDeadlineFrom, submissionDeadlineTo,
            awardedAmountMin, awardedAmountMax, includeArchived, sortBy, sortDirection);
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>
    /// Exports the filtered application list to Excel (.xlsx). Requires Admin, Elnok, or Penzugyes role.
    /// </summary>
    /// <response code="200">Excel file returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Export(
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? granterId = null,
        [FromQuery] Guid? applicationTypeId = null,
        [FromQuery] ApplicationStatus[]? statuses = null,
        [FromQuery] DateOnly? submissionDeadlineFrom = null,
        [FromQuery] DateOnly? submissionDeadlineTo = null,
        [FromQuery] decimal? awardedAmountMin = null,
        [FromQuery] decimal? awardedAmountMax = null,
        [FromQuery] bool includeArchived = false,
        CancellationToken ct = default)
    {
        var query = new ExportApplicationsQuery(
            searchTerm, granterId, applicationTypeId,
            statuses, submissionDeadlineFrom, submissionDeadlineTo,
            awardedAmountMin, awardedAmountMax, includeArchived);

        var result = await Sender.Send(query, ct);

        return File(
            result.Content,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            result.FileName);
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
