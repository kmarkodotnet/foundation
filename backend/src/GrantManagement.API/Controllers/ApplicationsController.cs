using GrantManagement.API.Common;
using GrantManagement.Application.Applications.Commands.CreateApplication;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Applications.Queries.GetApplicationList;
using GrantManagement.Application.Common.Models;
using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

public class ApplicationsController : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ApplicationListItemDto>), StatusCodes.Status200OK)]
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

    [HttpPost]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ApplicationDetailDto>> Create(
        [FromBody] CreateApplicationCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }
}
