using GrantManagement.API.Common;
using GrantManagement.Application.Search.DTOs;
using GrantManagement.Application.Search.Queries;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Global full-text search across applications, granters, and vendors.
/// </summary>
public class SearchController : ApiControllerBase
{
    /// <summary>
    /// Searches across applications, granters, and vendors. Minimum 3 characters required.
    /// </summary>
    /// <param name="q">Search term (minimum 3 characters).</param>
    /// <response code="200">Search results grouped by entity type.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="422">Search term shorter than 3 characters.</response>
    [HttpGet]
    [ProducesResponseType(typeof(GlobalSearchResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<GlobalSearchResultDto>> Search(
        [FromQuery] string q,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GlobalSearchQuery(q), ct));
    }
}
