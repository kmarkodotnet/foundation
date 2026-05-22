using GrantManagement.API.Common;
using GrantManagement.Application.EmailRecords.Commands.AttachEmailFile;
using GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;
using GrantManagement.Application.EmailRecords.Commands.DeleteEmailRecord;
using GrantManagement.Application.EmailRecords.DTOs;
using GrantManagement.Application.EmailRecords.Queries.DownloadEmailAttachment;
using GrantManagement.Application.EmailRecords.Queries.GetEmailPreview;
using GrantManagement.Application.EmailRecords.Queries.GetEmailRecords;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/emails")]
public class EmailRecordController : ApiControllerBase
{
    /// <summary>
    /// Lists all email records for an application, optionally filtered by workflow step.
    /// </summary>
    /// <response code="200">Email record list.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<EmailRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<EmailRecordDto>>> GetEmails(
        Guid applicationId,
        [FromQuery] Guid? stepId = null,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetEmailRecordsQuery(applicationId, stepId), ct));
    }

    /// <summary>
    /// Records a new email for an application.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="201">Email record created.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Application or workflow step not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPost]
    [ProducesResponseType(typeof(EmailRecordDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<EmailRecordDto>> CreateEmail(
        Guid applicationId,
        [FromBody] CreateEmailRecordCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command with { ApplicationId = applicationId }, ct);
        return CreatedAtAction(nameof(GetEmails), new { applicationId }, result);
    }

    /// <summary>
    /// Attaches an .eml or .msg file to an existing email record.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">File attached, updated email record returned.</response>
    /// <response code="400">Invalid file type or size.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Email record not found.</response>
    [HttpPost("{emailId:guid}/attachment")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(EmailRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmailRecordDto>> AttachFile(
        Guid applicationId,
        Guid emailId,
        IFormFile file,
        CancellationToken ct = default)
    {
        var command = new AttachEmailFileCommand
        {
            ApplicationId = applicationId,
            EmailRecordId = emailId,
            File = new EmailFileUpload(
                file.OpenReadStream(),
                file.FileName,
                file.ContentType,
                file.Length)
        };

        return Ok(await Sender.Send(command, ct));
    }

    /// <summary>
    /// Returns the parsed .eml preview data for an email record.
    /// </summary>
    /// <response code="200">EML preview data.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Email record or attachment not found.</response>
    [HttpGet("{emailId:guid}/preview")]
    [ProducesResponseType(typeof(EmlPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmlPreviewDto>> GetPreview(
        Guid applicationId,
        Guid emailId,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetEmailPreviewQuery(applicationId, emailId), ct));
    }

    /// <summary>
    /// Downloads the attached .eml or .msg file.
    /// </summary>
    /// <response code="200">File stream.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Email record or attachment not found.</response>
    [HttpGet("{emailId:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAttachment(
        Guid applicationId,
        Guid emailId,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new DownloadEmailAttachmentQuery(applicationId, emailId), ct);
        Response.Headers.Append(
            "Content-Disposition",
            $"attachment; filename=\"{result.FileName}\"");
        return File(result.Stream, result.ContentType);
    }

    /// <summary>
    /// Soft-deletes an email record.
    /// Only the creator or Admin can delete.
    /// </summary>
    /// <response code="204">Deleted.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Not creator or Admin, or application locked.</response>
    /// <response code="404">Email record not found.</response>
    [HttpDelete("{emailId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmail(
        Guid applicationId,
        Guid emailId,
        CancellationToken ct = default)
    {
        await Sender.Send(new DeleteEmailRecordCommand(applicationId, emailId), ct);
        return NoContent();
    }
}
