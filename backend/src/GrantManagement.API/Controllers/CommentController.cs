using GrantManagement.API.Common;
using GrantManagement.Application.Comments.Commands.AddComment;
using GrantManagement.Application.Comments.Commands.DeleteComment;
using GrantManagement.Application.Comments.Commands.UpdateComment;
using GrantManagement.Application.Comments.DTOs;
using GrantManagement.Application.Comments.Queries.GetComments;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/comments")]
public class CommentController : ApiControllerBase
{
    /// <summary>
    /// Lists comments for an application, optionally filtered by workflow step.
    /// </summary>
    /// <response code="200">Comment list ordered by creation date (oldest first).</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<CommentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CommentDto>>> GetComments(
        Guid applicationId,
        [FromQuery] Guid? stepId = null,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetCommentsQuery(applicationId, stepId), ct));
    }

    /// <summary>
    /// Adds a comment to an application (optionally linked to a workflow step).
    /// All authenticated users can comment.
    /// </summary>
    /// <response code="201">Comment created.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Application locked (non-Admin).</response>
    /// <response code="404">Application or workflow step not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPost]
    [ProducesResponseType(typeof(CommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<CommentDto>> AddComment(
        Guid applicationId,
        [FromBody] AddCommentCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command with { ApplicationId = applicationId }, ct);
        return CreatedAtAction(nameof(GetComments), new { applicationId }, result);
    }

    /// <summary>
    /// Updates the body of an existing comment.
    /// Only the author or Admin can edit.
    /// </summary>
    /// <response code="200">Updated comment.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Not author or Admin, or application locked.</response>
    /// <response code="404">Comment not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut("{commentId:guid}")]
    [ProducesResponseType(typeof(CommentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<CommentDto>> UpdateComment(
        Guid applicationId,
        Guid commentId,
        [FromBody] UpdateCommentCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(
            command with { ApplicationId = applicationId, CommentId = commentId }, ct));
    }

    /// <summary>
    /// Soft-deletes a comment. Only the author or Admin can delete.
    /// </summary>
    /// <response code="204">Deleted.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Not author or Admin, or application locked.</response>
    /// <response code="404">Comment not found.</response>
    [HttpDelete("{commentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(
        Guid applicationId,
        Guid commentId,
        CancellationToken ct = default)
    {
        await Sender.Send(new DeleteCommentCommand(applicationId, commentId), ct);
        return NoContent();
    }
}
