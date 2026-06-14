using GrantManagement.API.Common;
using GrantManagement.Application.AuditLogs.DTOs;
using GrantManagement.Application.OwnerAdministration.AuditLogs.Commands.ExportOwnerAuditLogs;
using GrantManagement.Application.OwnerAdministration.AuditLogs.Queries.GetOwnerAuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Owner;

[Route("api/v1/owner/audit-logs")]
public class OwnerAuditLogsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(GetOwnerAuditLogsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] Guid? foundationId,
        [FromQuery] Guid? userId,
        [FromQuery] DateTimeOffset? startDate,
        [FromQuery] DateTimeOffset? endDate,
        [FromQuery] string? entityType,
        [FromQuery] string? action,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
        => Ok(await Sender.Send(new GetOwnerAuditLogsQuery(foundationId, userId, startDate, endDate, entityType, action, page, pageSize)));

    [HttpGet("export")]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(
        [FromQuery] Guid? foundationId,
        [FromQuery] Guid? userId,
        [FromQuery] DateTimeOffset? startDate,
        [FromQuery] DateTimeOffset? endDate)
    {
        var result = await Sender.Send(new ExportOwnerAuditLogsCsvCommand(foundationId, userId, startDate, endDate));
        return File(result.CsvBytes, "text/csv", result.FileName);
    }
}
