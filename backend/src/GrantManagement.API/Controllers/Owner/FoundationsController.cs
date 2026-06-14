using GrantManagement.API.Common;
using GrantManagement.Application.OwnerAdministration.Foundations.Commands.ArchiveFoundation;
using GrantManagement.Application.OwnerAdministration.Foundations.Commands.AssignFoundationAdmin;
using GrantManagement.Application.OwnerAdministration.Foundations.Commands.CreateFoundation;
using GrantManagement.Application.OwnerAdministration.Foundations.Commands.RevokeFoundationAdmin;
using GrantManagement.Application.OwnerAdministration.Foundations.Queries.GetFoundationAdmins;
using GrantManagement.Application.OwnerAdministration.Foundations.Queries.GetFoundationsList;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Owner;

[Route("api/v1/owner/foundations")]
public class FoundationsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(GetFoundationsListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFoundations()
        => Ok(await Sender.Send(new GetFoundationsListQuery()));

    [HttpPost]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(typeof(CreateFoundationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateFoundation([FromBody] CreateFoundationCommand command)
    {
        var result = await Sender.Send(command);
        return CreatedAtAction(nameof(GetFoundations), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(typeof(ArchiveFoundationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveFoundation(Guid id)
        => Ok(await Sender.Send(new ArchiveFoundationCommand(id)));

    [HttpGet("{id:guid}/admins")]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(IReadOnlyList<FoundationAdminListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdmins(Guid id)
        => Ok(await Sender.Send(new GetFoundationAdminsQuery(id)));

    [HttpPost("{id:guid}/admins")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(typeof(AssignFoundationAdminResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignAdmin(Guid id, [FromBody] AssignFoundationAdminCommand command)
    {
        var result = await Sender.Send(command with { FoundationId = id });
        return Ok(result);
    }

    [HttpDelete("{id:guid}/admins/{userId:guid}")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeAdmin(Guid id, Guid userId)
    {
        await Sender.Send(new RevokeFoundationAdminCommand(id, userId));
        return NoContent();
    }
}
