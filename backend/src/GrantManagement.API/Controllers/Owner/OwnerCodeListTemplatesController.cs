using GrantManagement.API.Common;
using GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.AddTemplateItem;
using GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.ApplyTemplateToFoundation;
using GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.DeleteTemplateItem;
using GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.UpdateTemplateItem;
using GrantManagement.Application.OwnerAdministration.CodeListTemplates.Queries.GetOwnerCodeListTemplateDetails;
using GrantManagement.Application.OwnerAdministration.CodeListTemplates.Queries.GetOwnerCodeListTemplates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Owner;

[Route("api/v1/owner/code-list-templates")]
public class OwnerCodeListTemplatesController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(IReadOnlyList<OwnerCodeListTemplateListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTemplates()
        => Ok(await Sender.Send(new GetOwnerCodeListTemplatesQuery()));

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(OwnerCodeListTemplateDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTemplate(Guid id)
        => Ok(await Sender.Send(new GetOwnerCodeListTemplateDetailsQuery(id)));

    [HttpPost("{id:guid}/items")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddItem(Guid id, [FromBody] AddTemplateItemCommand command)
    {
        var itemId = await Sender.Send(command with { TemplateId = id });
        return StatusCode(StatusCodes.Status201Created, itemId);
    }

    [HttpPut("{id:guid}/items/{itemId:guid}")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(Guid id, Guid itemId, [FromBody] UpdateTemplateItemCommand command)
    {
        await Sender.Send(command with { TemplateId = id, ItemId = itemId });
        return NoContent();
    }

    [HttpDelete("{id:guid}/items/{itemId:guid}")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItem(Guid id, Guid itemId)
    {
        await Sender.Send(new DeleteTemplateItemCommand(id, itemId));
        return NoContent();
    }

    [HttpPost("{id:guid}/apply-to-foundation")]
    [Authorize(Policy = "IsOwnerAdmin")]
    [ProducesResponseType(typeof(ApplyTemplateToFoundationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApplyToFoundation(Guid id, [FromBody] ApplyTemplateToFoundationCommand command)
        => Ok(await Sender.Send(command with { TemplateId = id }));
}
