using GrantManagement.API.Common;
using GrantManagement.Application.OwnerAdministration.Users.Commands.AssignUserToFoundation;
using GrantManagement.Application.OwnerAdministration.Users.Commands.InviteOwnerUser;
using GrantManagement.Application.OwnerAdministration.Users.Commands.RevokeUserFoundationAssignment;
using GrantManagement.Application.OwnerAdministration.Users.Queries.GetOwnerUsersList;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Owner;

[Route("api/v1/owner/users")]
public class OwnerUsersController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(IReadOnlyList<OwnerUserListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers()
        => Ok(await Sender.Send(new GetOwnerUsersListQuery()));

    [HttpPost("invite")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(typeof(InviteOwnerUserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> InviteUser([FromBody] InviteOwnerUserCommand command)
    {
        var result = await Sender.Send(command);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("{id:guid}/assignments")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(typeof(AssignUserToFoundationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignToFoundation(Guid id, [FromBody] AssignUserToFoundationCommand command)
    {
        var result = await Sender.Send(command with { TargetUserId = id });
        return Ok(result);
    }

    [HttpDelete("{id:guid}/assignments/{foundationId:guid}")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeAssignment(Guid id, Guid foundationId)
    {
        await Sender.Send(new RevokeUserFoundationAssignmentCommand(id, foundationId));
        return NoContent();
    }
}
