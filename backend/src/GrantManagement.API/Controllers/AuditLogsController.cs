using GrantManagement.API.Common;
using GrantManagement.Application.AuditLogs.DTOs;
using GrantManagement.Application.AuditLogs.Queries.ExportAuditLog;
using GrantManagement.Application.AuditLogs.Queries.GetAuditLogList;
using GrantManagement.Application.Common.Models;
using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers;

/// <summary>
/// Audit log endpoints.
/// </summary>
[Route("api/v1/audit-logs")]
public class AuditLogsController : ApiControllerBase
{
    /// <summary>
    /// Returns a paged, filtered list of audit log entries. Admin + Elnok only.
    /// </summary>
    /// <response code="200">Paged audit log returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpGet]
    [Authorize(Policy = Policies.CanViewAuditLog)]
    [ProducesResponseType(typeof(PagedResult<AuditLogItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<AuditLogItemDto>>> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] Guid? userId = null,
        [FromQuery] DateTimeOffset? dateFrom = null,
        [FromQuery] DateTimeOffset? dateTo = null,
        [FromQuery] string? entityType = null,
        [FromQuery] AuditAction? action = null,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(
            new GetAuditLogListQuery(page, pageSize, userId, dateFrom, dateTo, entityType, null, action),
            ct));
    }

    /// <summary>
    /// Returns audit log entries for a specific application. Admin + Elnok only.
    /// </summary>
    /// <param name="applicationId">The application ID.</param>
    /// <response code="200">Application audit log returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpGet("application/{applicationId:guid}")]
    [Authorize(Policy = Policies.CanViewAuditLog)]
    [ProducesResponseType(typeof(IReadOnlyList<AuditLogItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<AuditLogItemDto>>> GetForApplication(
        Guid applicationId,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(
            new GetAuditLogListQuery(1, 500, null, null, null, "Application", applicationId, null),
            ct);
        return Ok(result.Items);
    }

    /// <summary>
    /// Exports audit log entries as a UTF-8 CSV file. Admin + Elnok only.
    /// </summary>
    /// <response code="200">CSV file returned.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Insufficient role.</response>
    [HttpGet("export")]
    [Authorize(Policy = Policies.CanViewAuditLog)]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Export(
        [FromQuery] Guid? userId = null,
        [FromQuery] DateTimeOffset? dateFrom = null,
        [FromQuery] DateTimeOffset? dateTo = null,
        [FromQuery] string? entityType = null,
        [FromQuery] AuditAction? action = null,
        CancellationToken ct = default)
    {
        var bytes = await Sender.Send(
            new ExportAuditLogQuery(userId, dateFrom, dateTo, entityType, action),
            ct);

        var fileName = $"audit_naplo_{DateTime.UtcNow:yyyyMMdd}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
}
