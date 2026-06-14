using GrantManagement.API.Common;
using GrantManagement.Application.Platform.BreakGlass.Commands.IssueBreakGlass;
using GrantManagement.Application.Platform.BreakGlass.Commands.RevokeBreakGlass;
using GrantManagement.Application.Platform.BreakGlass.Queries.GetBreakGlassGrantsList;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Platform;

[Route("api/v1/platform/break-glass")]
public class BreakGlassController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "CanReadPlatform")]
    [ProducesResponseType(typeof(GetBreakGlassGrantsListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGrants()
        => Ok(await Sender.Send(new GetBreakGlassGrantsListQuery()));

    [HttpPost]
    [Authorize(Policy = "CanIssueBreakGlass")]
    [ProducesResponseType(typeof(IssueBreakGlassGrantResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> IssueGrant([FromBody] IssueBreakGlassGrantCommand command)
        => Ok(await Sender.Send(command));

    [HttpPost("{id:guid}/revoke")]
    [Authorize(Policy = "CanIssueBreakGlass")]
    [ProducesResponseType(typeof(RevokeBreakGlassGrantResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeGrant(Guid id)
        => Ok(await Sender.Send(new RevokeBreakGlassGrantCommand(id)));
}
