using GrantManagement.Application.Authentication.Commands.ScopeSwitch;
using GrantManagement.Application.Authentication.Queries.GetAvailableScopes;
using GrantManagement.API.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Me;

[Route("api/v1/me")]
public class ScopeSwitchController : ApiControllerBase
{
    [HttpPost("scope-switch")]
    [Authorize]
    [ProducesResponseType(typeof(ScopeSwitchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ScopeSwitch([FromBody] ScopeSwitchCommand command)
    {
        var result = await Sender.Send(command);
        return Ok(result);
    }

    [HttpGet("available-scopes")]
    [Authorize]
    [ProducesResponseType(typeof(AvailableScopesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableScopes()
    {
        var result = await Sender.Send(new GetAvailableScopesQuery());
        return Ok(result);
    }
}
