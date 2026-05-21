using GrantManagement.API.Common;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Settlement.Commands.ApproveSettlement;
using GrantManagement.Application.Settlement.Commands.RecordSettlement;
using GrantManagement.Application.Settlement.Commands.RequestSettlementApproval;
using GrantManagement.Application.Settlement.DTOs;
using GrantManagement.Application.Settlement.Queries.GetSettlement;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/settlement")]
public class SettlementController : ApiControllerBase
{
    /// <summary>
    /// Gets the settlement for an application.
    /// Returns null (204) if no settlement has been recorded yet.
    /// </summary>
    /// <response code="200">Settlement found.</response>
    /// <response code="204">No settlement recorded yet.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Application not found.</response>
    [HttpGet]
    [ProducesResponseType(typeof(SettlementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SettlementDto>> GetSettlement(
        Guid applicationId,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetSettlementQuery(applicationId), ct);
        if (result == null) return NoContent();
        return Ok(result);
    }

    /// <summary>
    /// Records or updates the settlement for a Won application.
    /// Requires Admin or Penzugyes role.
    /// </summary>
    /// <response code="200">Settlement recorded/updated.</response>
    /// <response code="400">Application is not in Won status or domain error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application is locked.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut]
    [ProducesResponseType(typeof(SettlementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SettlementDto>> RecordSettlement(
        Guid applicationId,
        [FromBody] RecordSettlementCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId }, ct));
    }

    /// <summary>
    /// Sends an approval request notification to all Elnok users for the settlement.
    /// Requires Admin or Penzugyes role.
    /// </summary>
    /// <response code="204">Approval request sent.</response>
    /// <response code="400">No settlement recorded yet.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpPost("request-approval")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestApproval(
        Guid applicationId,
        CancellationToken ct = default)
    {
        await Sender.Send(new RequestSettlementApprovalCommand(applicationId), ct);
        return NoContent();
    }

    /// <summary>
    /// Approves or rejects the settlement. On approval, closes the application as ClosedWon.
    /// Requires Admin or Elnok role.
    /// </summary>
    /// <response code="200">Settlement approved/rejected. Returns updated application detail.</response>
    /// <response code="400">No settlement or domain error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error (rejection note required when rejecting).</response>
    [HttpPost("approve")]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ApplicationDetailDto>> ApproveSettlement(
        Guid applicationId,
        [FromBody] ApproveSettlementCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId }, ct));
    }
}
