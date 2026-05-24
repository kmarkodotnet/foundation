using GrantManagement.API.Common;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Workflow.Commands.ApproveStep;
using GrantManagement.Application.Workflow.Commands.CloseApplication;
using GrantManagement.Application.Workflow.Commands.CompleteStep;
using GrantManagement.Application.Workflow.Commands.CorrectResult;
using GrantManagement.Application.Workflow.Commands.RecordResult;
using GrantManagement.Application.Workflow.Commands.RequestApproval;
using GrantManagement.Application.Workflow.Commands.RestoreStep;
using GrantManagement.Application.Workflow.Commands.SkipStep;
using GrantManagement.Application.Workflow.Commands.UpdateContractStep;
using GrantManagement.Application.Workflow.Commands.UpdateSubmissionStep;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/workflow")]
public class WorkflowController : ApiControllerBase
{
    /// <summary>
    /// Records submission data for the Submission workflow step.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Submission step updated.</response>
    /// <response code="400">Step not in Active state or validation error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application is locked.</response>
    /// <response code="404">Application not found.</response>
    [HttpPut("submission")]
    [ProducesResponseType(typeof(WorkflowStepDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowStepDetailDto>> UpdateSubmission(
        Guid applicationId,
        [FromBody] UpdateSubmissionStepCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId }, ct));
    }

    /// <summary>
    /// Sends an approval request notification to all Elnok users.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="204">Approval request sent.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpPost("submission/request-approval")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestApproval(
        Guid applicationId,
        CancellationToken ct = default)
    {
        await Sender.Send(new RequestApprovalCommand(applicationId), ct);
        return NoContent();
    }

    /// <summary>
    /// Approves or rejects a workflow step. Requires Admin or Elnok role.
    /// </summary>
    /// <response code="200">Step approved or rejected.</response>
    /// <response code="400">Validation error or step not approvalble.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role (requires Admin or Elnok).</response>
    /// <response code="404">Application not found.</response>
    /// <summary>
    /// Records the result (Won/Lost) for an application. Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Result recorded.</response>
    /// <response code="400">Step not Active or domain validation error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut("result")]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ApplicationDetailDto>> RecordResult(
        Guid applicationId,
        [FromBody] RecordResultCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId }, ct));
    }

    /// <summary>
    /// Closes a Lost application as ClosedLost. Requires Admin or Elnok role.
    /// </summary>
    /// <response code="200">Application closed.</response>
    /// <response code="400">Application is not in Lost status.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpPut("close-lost")]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationDetailDto>> CloseLost(
        Guid applicationId,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new CloseApplicationCommand(applicationId), ct));
    }

    /// <summary>
    /// Corrects a previously recorded result. Admin only.
    /// </summary>
    /// <response code="200">Result corrected.</response>
    /// <response code="400">Application is Closed/Archived.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Not Admin.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut("result/correct")]
    [ProducesResponseType(typeof(ApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ApplicationDetailDto>> CorrectResult(
        Guid applicationId,
        [FromBody] CorrectResultCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId }, ct));
    }

    /// <summary>
    /// Records contract and notification data for the ContractGranter step.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Step data saved.</response>
    /// <response code="400">Step not Active or domain validation error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut("contract-granter")]
    [ProducesResponseType(typeof(WorkflowStepDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<WorkflowStepDetailDto>> UpdateContractStep(
        Guid applicationId,
        [FromBody] UpdateContractStepCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId }, ct));
    }

    /// <summary>
    /// Completes a workflow step and activates the next pending step.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Step completed.</response>
    /// <response code="400">Step not in Active state.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpPost("{stepType}/complete")]
    [ProducesResponseType(typeof(WorkflowStepDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowStepDetailDto>> CompleteStep(
        Guid applicationId,
        WorkflowStepType stepType,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new CompleteStepCommand(applicationId, stepType), ct));
    }

    /// <summary>
    /// Skips a skippable workflow step with an optional reason.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Step skipped.</response>
    /// <response code="400">Step is not skippable or domain error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpPost("{stepType}/skip")]
    [ProducesResponseType(typeof(WorkflowStepDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowStepDetailDto>> SkipStep(
        Guid applicationId,
        WorkflowStepType stepType,
        [FromBody] SkipStepCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId, StepType = stepType }, ct));
    }

    /// <summary>
    /// Restores a skipped step back to Active. Requires Admin or Elnok role.
    /// </summary>
    /// <response code="200">Step restored.</response>
    /// <response code="400">Domain error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application not found.</response>
    [HttpPost("{stepType}/restore")]
    [ProducesResponseType(typeof(WorkflowStepDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowStepDetailDto>> RestoreStep(
        Guid applicationId,
        WorkflowStepType stepType,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new RestoreStepCommand(applicationId, stepType), ct));
    }

    [HttpPost("{stepType}/approve")]
    [ProducesResponseType(typeof(WorkflowStepDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkflowStepDetailDto>> ApproveStep(
        Guid applicationId,
        WorkflowStepType stepType,
        [FromBody] ApproveStepCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId, StepType = stepType }, ct));
    }
}
