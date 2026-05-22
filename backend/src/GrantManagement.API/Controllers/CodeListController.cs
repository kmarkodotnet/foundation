using GrantManagement.API.Common;
using GrantManagement.Application.CodeLists.Commands.ActivateCodeListItem;
using GrantManagement.Application.CodeLists.Commands.CreateCodeList;
using GrantManagement.Application.CodeLists.Commands.CreateCodeListItem;
using GrantManagement.Application.CodeLists.Commands.DeactivateCodeListItem;
using GrantManagement.Application.CodeLists.Commands.DeleteCodeList;
using GrantManagement.Application.CodeLists.Commands.ReorderCodeListItems;
using GrantManagement.Application.CodeLists.Commands.UpdateCodeListItem;
using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.CodeLists.Queries.GetCodeListItems;
using GrantManagement.Application.CodeLists.Queries.GetCodeLists;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/code-lists")]
/// <summary>
/// CodeList management endpoints.
/// </summary>
public class CodeListController : ApiControllerBase
{
    /// <summary>Returns all codelists with item counts.</summary>
    /// <response code="200">List returned.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<CodeListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CodeListDto>>> GetAll(CancellationToken ct = default)
        => Ok(await Sender.Send(new GetCodeListsQuery(), ct));

    /// <summary>Returns items of a codelist.</summary>
    /// <response code="200">Items returned.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet("{id:guid}/items")]
    [ProducesResponseType(typeof(List<CodeListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CodeListItemDto>>> GetItems(
        Guid id,
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
        => Ok(await Sender.Send(new GetCodeListItemsQuery(id, includeInactive), ct));

    /// <summary>Creates a new custom codelist. Requires Admin.</summary>
    /// <response code="201">CodeList created.</response>
    /// <response code="400">Duplicate name.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpPost]
    [ProducesResponseType(typeof(CodeListDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CodeListDto>> Create(
        [FromBody] CreateCodeListCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command, ct);
        return Created($"api/v1/code-lists/{result.Id}", result);
    }

    /// <summary>Deletes a custom codelist. Requires Admin.</summary>
    /// <response code="204">Deleted.</response>
    /// <response code="400">System codelist or has items.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">CodeList not found.</response>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        await Sender.Send(new DeleteCodeListCommand(id), ct);
        return NoContent();
    }

    /// <summary>Adds an item to a codelist. Requires Admin.</summary>
    /// <response code="201">Item created.</response>
    /// <response code="400">Duplicate code.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">CodeList not found.</response>
    [HttpPost("{id:guid}/items")]
    [ProducesResponseType(typeof(CodeListItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CodeListItemDto>> CreateItem(
        Guid id,
        [FromBody] CreateCodeListItemCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command with { CodeListId = id }, ct);
        return Created($"api/v1/code-lists/{id}/items/{result.Id}", result);
    }

    /// <summary>Updates an item in a codelist. Requires Admin.</summary>
    /// <response code="200">Item updated.</response>
    /// <response code="400">Duplicate code.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">CodeList not found.</response>
    [HttpPut("{id:guid}/items/{itemId:guid}")]
    [ProducesResponseType(typeof(CodeListItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CodeListItemDto>> UpdateItem(
        Guid id,
        Guid itemId,
        [FromBody] UpdateCodeListItemCommand command,
        CancellationToken ct = default)
        => Ok(await Sender.Send(command with { CodeListId = id, ItemId = itemId }, ct));

    /// <summary>Deactivates an item. Requires Admin.</summary>
    /// <response code="204">Item deactivated.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">CodeList not found.</response>
    [HttpPatch("{id:guid}/items/{itemId:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateItem(Guid id, Guid itemId, CancellationToken ct = default)
    {
        await Sender.Send(new DeactivateCodeListItemCommand(id, itemId), ct);
        return NoContent();
    }

    /// <summary>Activates an item. Requires Admin.</summary>
    /// <response code="204">Item activated.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">CodeList not found.</response>
    [HttpPatch("{id:guid}/items/{itemId:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateItem(Guid id, Guid itemId, CancellationToken ct = default)
    {
        await Sender.Send(new ActivateCodeListItemCommand(id, itemId), ct);
        return NoContent();
    }

    /// <summary>Reorders items in a codelist. Requires Admin.</summary>
    /// <response code="200">Items reordered.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">CodeList not found.</response>
    [HttpPut("{id:guid}/items/reorder")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReorderItems(
        Guid id,
        [FromBody] ReorderCodeListItemsCommand command,
        CancellationToken ct = default)
    {
        await Sender.Send(command with { CodeListId = id }, ct);
        return Ok();
    }
}
