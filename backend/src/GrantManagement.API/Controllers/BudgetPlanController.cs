using GrantManagement.API.Common;
using GrantManagement.Application.BudgetPlan.Commands.RequestBudgetPlanApproval;
using GrantManagement.Application.BudgetPlan.Commands.UpsertBudgetPlan;
using GrantManagement.Application.BudgetPlan.DTOs;
using GrantManagement.Application.BudgetPlan.Queries.GetBudgetPlan;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/budget-plan")]
public class BudgetPlanController : ApiControllerBase
{
    /// <summary>
    /// Gets the budget plan for an application.
    /// </summary>
    /// <response code="200">Budget plan found.</response>
    /// <response code="204">No budget plan exists yet.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Application not found.</response>
    [HttpGet]
    [ProducesResponseType(typeof(BudgetPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BudgetPlanDto>> GetBudgetPlan(
        Guid applicationId,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetBudgetPlanQuery(applicationId), ct);
        if (result == null) return NoContent();
        return Ok(result);
    }

    /// <summary>
    /// Creates or updates the budget plan and its items.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Budget plan saved.</response>
    /// <response code="400">Application not Won or BudgetPlan step not Active.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut]
    [ProducesResponseType(typeof(BudgetPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<BudgetPlanDto>> UpsertBudgetPlan(
        Guid applicationId,
        [FromBody] UpsertBudgetPlanCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { ApplicationId = applicationId }, ct));
    }

    /// <summary>
    /// Sends an approval request notification to all Elnok users for the budget plan.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="204">Approval request sent.</response>
    /// <response code="400">No budget plan or no items.</response>
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
        await Sender.Send(new RequestBudgetPlanApprovalCommand(applicationId), ct);
        return NoContent();
    }
}
