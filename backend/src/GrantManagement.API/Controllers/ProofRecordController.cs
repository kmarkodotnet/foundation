using GrantManagement.API.Models;
using GrantManagement.Application.ProofRecords.Commands.CreateProofRecord;
using GrantManagement.Application.ProofRecords.DTOs;
using GrantManagement.Application.ProofRecords.Queries.DownloadAllProofPhotos;
using GrantManagement.Application.ProofRecords.Queries.GetProofPhoto;
using GrantManagement.Application.ProofRecords.Queries.GetProofRecords;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/proof-records")]
public class ProofRecordController : Common.ApiControllerBase
{
    /// <summary>
    /// Lists all proof records for an application.
    /// </summary>
    /// <response code="200">List of proof records with photos.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Application not found.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProofRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<ProofRecordDto>>> GetProofRecords(
        Guid applicationId,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetProofRecordsQuery(applicationId), ct));
    }

    /// <summary>
    /// Records a new proof of completion with photos.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="201">Proof record created.</response>
    /// <response code="400">Application not Won.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error (no photos, invalid type, etc.).</response>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ProofRecordDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ProofRecordDto>> CreateProofRecord(
        Guid applicationId,
        [FromForm] CreateProofRecordRequest request,
        CancellationToken ct = default)
    {
        var photos = (request.Photos ?? [])
            .Select(f => new GrantManagement.Application.ProofRecords.DTOs.PhotoUpload(
                f.OpenReadStream(), f.FileName, f.ContentType, f.Length))
            .ToList();

        var command = new CreateProofRecordCommand
        {
            ApplicationId = applicationId,
            ProofType = request.ProofType,
            EventDate = request.EventDate,
            Notes = request.Notes,
            Photos = photos
        };

        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetProofRecords), new { applicationId }, result);
    }

    /// <summary>
    /// Downloads a single proof photo by ID.
    /// </summary>
    /// <response code="200">Photo file stream.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Photo or record not found.</response>
    [HttpGet("{recordId:guid}/photos/{photoId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProofPhoto(
        Guid applicationId,
        Guid recordId,
        Guid photoId,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(
            new GetProofPhotoQuery(applicationId, recordId, photoId), ct);

        return File(result.Stream, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Downloads all proof photos for a record as a ZIP archive.
    /// </summary>
    /// <response code="200">ZIP archive of all photos.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Record not found.</response>
    [HttpGet("{recordId:guid}/photos/download-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAllProofPhotos(
        Guid applicationId,
        Guid recordId,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(
            new DownloadAllProofPhotosQuery(applicationId, recordId), ct);

        return File(result.Stream, result.ContentType, result.FileName);
    }
}
