using GrantManagement.API.Common;
using GrantManagement.Application.Vendors.Commands.ActivateVendor;
using GrantManagement.Application.Vendors.Commands.CreateVendor;
using GrantManagement.Application.Vendors.Commands.DeactivateVendor;
using GrantManagement.Application.Vendors.Commands.UpdateVendor;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Application.Vendors.Queries.GetVendorDetail;
using GrantManagement.Application.Vendors.Queries.GetVendors;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Vendor (szerződő cég) management endpoints.
/// </summary>
public class VendorsController : ApiControllerBase
{
    /// <summary>
    /// Returns a list of vendors, optionally filtered by search term or including inactive.
    /// </summary>
    /// <response code="200">List returned.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<VendorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<VendorDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetVendorsQuery(search, includeInactive), ct));
    }

    /// <summary>
    /// Returns full vendor details including linked contracts.
    /// </summary>
    /// <response code="200">Vendor detail returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Vendor not found.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(VendorDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDetailDto>> GetById(Guid id, CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetVendorDetailQuery(id), ct));
    }

    /// <summary>
    /// Creates a new vendor. Requires Admin, PalyazatiMunkatars, or Penzugyes role.
    /// </summary>
    /// <response code="201">Vendor created.</response>
    /// <response code="400">Duplicate name or domain error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpPost]
    [ProducesResponseType(typeof(CreateVendorResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CreateVendorResult>> Create(
        [FromBody] CreateVendorCommand command,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(command, ct);
        return Created($"api/v1/vendors/{result.Vendor.Id}", result);
    }

    /// <summary>
    /// Updates a vendor. Requires Admin or PalyazatiMunkatars role.
    /// </summary>
    /// <response code="200">Vendor updated.</response>
    /// <response code="400">Duplicate name or domain error.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Vendor not found.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(VendorDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDetailDto>> Update(
        Guid id,
        [FromBody] UpdateVendorCommand command,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(command with { VendorId = id }, ct));
    }

    /// <summary>
    /// Deactivates a vendor. Requires Admin role.
    /// </summary>
    /// <response code="200">Vendor deactivated.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Vendor not found.</response>
    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(typeof(VendorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDto>> Deactivate(Guid id, CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new DeactivateVendorCommand(id), ct));
    }

    /// <summary>
    /// Activates a vendor. Requires Admin role.
    /// </summary>
    /// <response code="200">Vendor activated.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Vendor not found.</response>
    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(typeof(VendorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDto>> Activate(Guid id, CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new ActivateVendorCommand(id), ct));
    }
}
