using GrantManagement.API.Models;
using GrantManagement.Application.Documents.Commands.ArchiveDocument;
using GrantManagement.Application.Documents.Commands.UploadDocument;
using GrantManagement.Application.Documents.Commands.UploadDocumentVersion;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Application.Documents.Queries.DownloadDocument;
using GrantManagement.Application.Documents.Queries.GetDocuments;
using GrantManagement.Application.Documents.Queries.GetDocumentVersions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[ApiController]
[Route("api/v1/applications/{applicationId:guid}/documents")]
[Authorize]
public class DocumentController : ControllerBase
{
    private ISender? _sender;
    private ISender Sender =>
        _sender ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    /// <summary>
    /// Lists documents for an application, optionally filtered by workflow step.
    /// </summary>
    /// <param name="applicationId">Application ID.</param>
    /// <param name="stepId">Optional workflow step filter.</param>
    /// <param name="includeArchived">Include archived documents (default false).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Document list returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Application not found.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<DocumentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<DocumentDto>>> GetDocuments(
        Guid applicationId,
        [FromQuery] Guid? stepId = null,
        [FromQuery] bool includeArchived = false,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetDocumentsQuery(applicationId, stepId, includeArchived), ct));
    }

    /// <summary>
    /// Uploads a document to a workflow step.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <param name="applicationId">Application ID.</param>
    /// <param name="request">Upload form data.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="201">Document uploaded successfully.</response>
    /// <response code="400">Invalid file type or size, or no active step.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Application or workflow step not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<DocumentDto>> UploadDocument(
        Guid applicationId,
        [FromForm] UploadDocumentRequest request,
        CancellationToken ct = default)
    {
        var command = new UploadDocumentCommand
        {
            ApplicationId = applicationId,
            WorkflowStepId = request.WorkflowStepId,
            DocumentType = request.DocumentType,
            DisplayName = request.DisplayName,
            File = new DocumentUpload(
                request.File.OpenReadStream(),
                request.File.FileName,
                request.File.ContentType,
                request.File.Length)
        };

        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetDocuments), new { applicationId }, result);
    }

    /// <summary>
    /// Downloads a document by ID. PDFs are served inline; other formats as attachment.
    /// Archived (superseded) versions can also be downloaded.
    /// </summary>
    /// <param name="applicationId">Application ID.</param>
    /// <param name="documentId">Document ID.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">File stream returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Document not found.</response>
    [HttpGet("{documentId:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(
        Guid applicationId,
        Guid documentId,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new DownloadDocumentQuery(applicationId, documentId), ct);

        var isPdf = result.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase);
        Response.Headers.Append(
            "Content-Disposition",
            isPdf
                ? $"inline; filename=\"{result.FileName}\""
                : $"attachment; filename=\"{result.FileName}\"");

        return File(result.Stream, result.ContentType);
    }

    /// <summary>
    /// Uploads a new version of an existing document.
    /// The current version is archived automatically.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <param name="applicationId">Application ID.</param>
    /// <param name="documentId">Parent document ID to supersede.</param>
    /// <param name="request">Upload form data.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="201">New version created.</response>
    /// <response code="400">Invalid file type or size.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Document not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPost("{documentId:guid}/versions")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<DocumentDto>> UploadDocumentVersion(
        Guid applicationId,
        Guid documentId,
        [FromForm] UploadDocumentVersionRequest request,
        CancellationToken ct = default)
    {
        var command = new UploadDocumentVersionCommand
        {
            ApplicationId = applicationId,
            DocumentId = documentId,
            DisplayName = request.DisplayName,
            File = new DocumentUpload(
                request.File.OpenReadStream(),
                request.File.FileName,
                request.File.ContentType,
                request.File.Length)
        };

        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetDocuments), new { applicationId }, result);
    }

    /// <summary>
    /// Returns the version history for a document.
    /// Includes all archived and current versions.
    /// </summary>
    /// <param name="applicationId">Application ID.</param>
    /// <param name="documentId">Document ID (any version in the chain).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Version list returned (newest first).</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Document not found.</response>
    [HttpGet("{documentId:guid}/versions")]
    [ProducesResponseType(typeof(List<DocumentVersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<DocumentVersionDto>>> GetDocumentVersions(
        Guid applicationId,
        Guid documentId,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetDocumentVersionsQuery(applicationId, documentId), ct));
    }

    /// <summary>
    /// Archives a document. Requires Admin role.
    /// </summary>
    /// <param name="applicationId">Application ID.</param>
    /// <param name="documentId">Document ID.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="204">Document archived.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Document not found.</response>
    [HttpPatch("{documentId:guid}/archive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveDocument(
        Guid applicationId,
        Guid documentId,
        CancellationToken ct = default)
    {
        await Sender.Send(new ArchiveDocumentCommand(applicationId, documentId), ct);
        return NoContent();
    }
}
