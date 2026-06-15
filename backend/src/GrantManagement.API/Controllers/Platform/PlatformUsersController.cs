using GrantManagement.API.Common;
using GrantManagement.Application.Platform.Users.Commands.InvitePlatformUser;
using GrantManagement.Application.Platform.Users.Queries.GetPlatformUsersList;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Platform;

[Route("api/v1/platform/users")]
public class PlatformUsersController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [Authorize(Policy = "IsPlatformAdmin")]
    [ProducesResponseType(typeof(GetPlatformUsersListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers()
        => Ok(await Sender.Send(new GetPlatformUsersListQuery()));

    [HttpPost("invite")]
    [Authorize(Policy = "IsPlatformAdmin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> InviteUser([FromBody] InvitePlatformUserCommand command)
    {
        await Sender.Send(command);
        return StatusCode(StatusCodes.Status201Created);
    }
}
