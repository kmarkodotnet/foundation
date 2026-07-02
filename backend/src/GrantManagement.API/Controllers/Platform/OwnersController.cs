using GrantManagement.Application.Platform.Owners.Commands.ProvisionOwner;
using GrantManagement.Application.Platform.Owners.Commands.SuspendOwner;
using GrantManagement.Application.Platform.Owners.Commands.ReactivateOwner;
using GrantManagement.Application.Platform.Owners.Commands.ArchiveOwner;
using GrantManagement.Application.Platform.Owners.Queries.GetOwnerDetails;
using GrantManagement.Application.Platform.Owners.Queries.GetOwnersList;
using GrantManagement.API.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Platform;

[Route("api/v1/platform/owners")]
public class OwnersController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [Authorize(Policy = "CanReadPlatform")]
    [ProducesResponseType(typeof(GetOwnersListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOwners([FromQuery] GetOwnersListQuery query)
        => Ok(await Sender.Send(query));

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "CanReadPlatform")]
    [ProducesResponseType(typeof(OwnerDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOwner(Guid id)
        => Ok(await Sender.Send(new GetOwnerDetailsQuery(id)));

    [HttpPost]
    [Authorize(Policy = "IsPlatformAdmin")]
    [ProducesResponseType(typeof(ProvisionOwnerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ProvisionOwner([FromBody] ProvisionOwnerCommand command)
    {
        var result = await Sender.Send(command);
        return CreatedAtAction(nameof(GetOwner), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/suspend")]
    [Authorize(Policy = "IsPlatformAdmin")]
    [ProducesResponseType(typeof(SuspendOwnerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendOwner(Guid id)
        => Ok(await Sender.Send(new SuspendOwnerCommand(id)));

    [HttpPost("{id:guid}/reactivate")]
    [Authorize(Policy = "IsPlatformAdmin")]
    [ProducesResponseType(typeof(ReactivateOwnerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReactivateOwner(Guid id)
        => Ok(await Sender.Send(new ReactivateOwnerCommand(id)));

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = "IsPlatformAdmin")]
    [ProducesResponseType(typeof(ArchiveOwnerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveOwner(Guid id)
        => Ok(await Sender.Send(new ArchiveOwnerCommand(id)));
}
