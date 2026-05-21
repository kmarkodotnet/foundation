using GrantManagement.API.Common;
using GrantManagement.Application.VendorContracts.Commands.CreateVendorContract;
using GrantManagement.Application.VendorContracts.Commands.DeleteVendorContract;
using GrantManagement.Application.VendorContracts.DTOs;
using GrantManagement.Application.VendorContracts.Queries.GetVendorContracts;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/vendor-contracts")]
public class VendorContractController : ApiControllerBase
{
    /// <summary>
    /// Lists all vendor contracts for an application.
    /// </summary>
    /// <response code="200">List of vendor contracts.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Application not found.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<VendorContractDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<VendorContractDto>>> GetVendorContracts(
        Guid applicationId,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetVendorContractsQuery(applicationId), ct));
    }

    /// <summary>
    /// Records a new vendor contract for an application.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="201">Vendor contract created.</response>
    /// <response code="400">Application not Won or VendorContracts step not Active.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Application or Vendor not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPost]
    [ProducesResponseType(typeof(VendorContractDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<VendorContractDto>> CreateVendorContract(
        Guid applicationId,
        [FromBody] CreateVendorContractCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command with { ApplicationId = applicationId }, ct);
        return CreatedAtAction(nameof(GetVendorContracts), new { applicationId }, result);
    }

    /// <summary>
    /// Deletes a vendor contract.
    /// Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="204">Vendor contract deleted.</response>
    /// <response code="400">Contract has linked invoices and cannot be deleted.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Application or contract not found.</response>
    [HttpDelete("{contractId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVendorContract(
        Guid applicationId,
        Guid contractId,
        CancellationToken ct = default)
    {
        await Sender.Send(new DeleteVendorContractCommand(applicationId, contractId), ct);
        return NoContent();
    }
}
