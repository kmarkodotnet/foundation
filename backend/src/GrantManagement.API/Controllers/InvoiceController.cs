using GrantManagement.API.Common;
using GrantManagement.Application.Invoices.Commands.CreateInvoice;
using GrantManagement.Application.Invoices.Commands.DeleteInvoice;
using GrantManagement.Application.Invoices.Commands.MarkInvoicePaid;
using GrantManagement.Application.Invoices.Commands.UpdateInvoice;
using GrantManagement.Application.Invoices.DTOs;
using GrantManagement.Application.Invoices.Queries.GetInvoices;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

[Route("api/v1/applications/{applicationId:guid}/invoices")]
public class InvoiceController : ApiControllerBase
{
    /// <summary>
    /// Lists all invoices for an application with financial summary.
    /// </summary>
    /// <response code="200">Invoice list with summary.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Application not found.</response>
    [HttpGet]
    [ProducesResponseType(typeof(InvoiceListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvoiceListDto>> GetInvoices(
        Guid applicationId,
        [FromQuery] bool? isPaid = null,
        [FromQuery] DateOnly? dateFrom = null,
        [FromQuery] DateOnly? dateTo = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(
            new GetInvoicesQuery(applicationId, isPaid, dateFrom, dateTo, sortBy, sortDirection), ct));
    }

    /// <summary>
    /// Records a new invoice for an application.
    /// Requires Admin or Penzugyes role.
    /// </summary>
    /// <response code="201">Invoice created.</response>
    /// <response code="400">Application not Won.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role or application locked.</response>
    /// <response code="404">Application not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPost]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice(
        Guid applicationId,
        [FromBody] CreateInvoiceCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command with { ApplicationId = applicationId }, ct);
        return CreatedAtAction(nameof(GetInvoices), new { applicationId }, result);
    }

    /// <summary>
    /// Marks an invoice as paid.
    /// Requires Admin or Penzugyes role.
    /// </summary>
    /// <response code="200">Invoice marked as paid.</response>
    /// <response code="400">Invoice already paid or application locked.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application or invoice not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPatch("{invoiceId:guid}/mark-paid")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<InvoiceDto>> MarkInvoicePaid(
        Guid applicationId,
        Guid invoiceId,
        [FromBody] MarkInvoicePaidCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(
            command with { ApplicationId = applicationId, InvoiceId = invoiceId }, ct);
        return Ok(result);
    }

    /// <summary>
    /// Updates an invoice.
    /// Requires Admin or Penzugyes role.
    /// </summary>
    /// <response code="200">Invoice updated.</response>
    /// <response code="400">Application locked.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application or invoice not found.</response>
    /// <response code="422">Validation error.</response>
    [HttpPut("{invoiceId:guid}")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<InvoiceDto>> UpdateInvoice(
        Guid applicationId,
        Guid invoiceId,
        [FromBody] UpdateInvoiceCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(
            command with { ApplicationId = applicationId, InvoiceId = invoiceId }, ct);
        return Ok(result);
    }

    /// <summary>
    /// Soft-deletes an invoice.
    /// Requires Admin or Penzugyes role.
    /// </summary>
    /// <response code="204">Invoice deleted.</response>
    /// <response code="400">Application is locked.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Application or invoice not found.</response>
    [HttpDelete("{invoiceId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteInvoice(
        Guid applicationId,
        Guid invoiceId,
        CancellationToken ct = default)
    {
        await Sender.Send(new DeleteInvoiceCommand(applicationId, invoiceId), ct);
        return NoContent();
    }
}
