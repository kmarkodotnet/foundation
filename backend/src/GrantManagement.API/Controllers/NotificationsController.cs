using GrantManagement.API.Common;
using GrantManagement.Application.Notifications.Commands.MarkAllNotificationsRead;
using GrantManagement.Application.Notifications.Commands.MarkNotificationRead;
using GrantManagement.Application.Notifications.DTOs;
using GrantManagement.Application.Notifications.Queries.GetMyNotifications;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Manages in-app notifications for the current user.
/// </summary>
public class NotificationsController : ApiControllerBase
{
    /// <summary>
    /// Returns notifications for the current user.
    /// </summary>
    /// <param name="includeRead">When true, includes already-read notifications.</param>
    /// <response code="200">List of notifications.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetMy(
        [FromQuery] bool includeRead = false,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetMyNotificationsQuery(includeRead), ct));
    }

    /// <summary>
    /// Marks a single notification as read.
    /// </summary>
    /// <param name="id">Notification ID.</param>
    /// <response code="204">Marked as read.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Notification not found or belongs to another user.</response>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct = default)
    {
        await Sender.Send(new MarkNotificationReadCommand(id), ct);
        return NoContent();
    }

    /// <summary>
    /// Marks all unread notifications as read for the current user.
    /// </summary>
    /// <response code="204">All marked as read.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpPatch("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct = default)
    {
        await Sender.Send(new MarkAllNotificationsReadCommand(), ct);
        return NoContent();
    }
}
