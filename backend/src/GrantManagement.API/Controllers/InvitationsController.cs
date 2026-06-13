using GrantManagement.API.Common;
using GrantManagement.Application.Invitations.Commands.CreateInvitation;
using GrantManagement.Application.Invitations.Commands.ResendInvitation;
using GrantManagement.Application.Invitations.Commands.RevokeInvitation;
using GrantManagement.Application.Invitations.DTOs;
using GrantManagement.Application.Invitations.Queries.GetInvitations;
using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Invitation management endpoints (Admin only).
/// </summary>
[Authorize(Policy = Policies.CanManageUsers)]
public class InvitationsController : ApiControllerBase
{
    private readonly IConfiguration _configuration;

    public InvitationsController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// Lists all invitations, optionally filtered by status.
    /// </summary>
    /// <response code="200">Invitation list returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<InvitationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<InvitationResponse>>> GetAll(
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetInvitationsQuery(status), ct));
    }

    /// <summary>
    /// Creates and sends a new invitation email.
    /// </summary>
    /// <response code="201">Invitation created and email sent.</response>
    /// <response code="400">An active invitation for this email already exists.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="422">Validation error.</response>
    [HttpPost]
    [ProducesResponseType(typeof(InvitationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<InvitationResponse>> Create(
        [FromBody] CreateInvitationRequest body,
        CancellationToken ct = default)
    {
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:4200";
        var result = await Sender.Send(new CreateInvitationCommand(body.Email, body.Role, frontendBaseUrl), ct);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    /// <summary>
    /// Revokes a pending invitation.
    /// </summary>
    /// <response code="200">Invitation revoked.</response>
    /// <response code="400">Invitation is not in PENDING state.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Invitation not found.</response>
    [HttpPut("{id:guid}/revoke")]
    [ProducesResponseType(typeof(InvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvitationResponse>> Revoke(Guid id, CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new RevokeInvitationCommand(id), ct));
    }

    /// <summary>
    /// Resends a pending or expired invitation with a new token and expiry.
    /// </summary>
    /// <response code="200">Invitation resent.</response>
    /// <response code="400">Invitation is accepted or revoked — cannot resend.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    /// <response code="404">Invitation not found.</response>
    [HttpPost("{id:guid}/resend")]
    [ProducesResponseType(typeof(InvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvitationResponse>> Resend(Guid id, CancellationToken ct = default)
    {
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:4200";
        return Ok(await Sender.Send(new ResendInvitationCommand(id, frontendBaseUrl), ct));
    }
}

public record CreateInvitationRequest(string Email, UserRole Role);
