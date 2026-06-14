using GrantManagement.API.Common;
using GrantManagement.Application.Platform.AuditLogs.Queries.GetPlatformAuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace GrantManagement.API.Controllers.Platform;

[Route("api/v1/platform/audit-logs")]
public class PlatformAuditLogsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "CanReadPlatform")]
    [ProducesResponseType(typeof(GetPlatformAuditLogsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] GetPlatformAuditLogsQuery query)
        => Ok(await Sender.Send(query));

    [HttpGet("export")]
    [Authorize(Policy = "CanReadPlatform")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCsv([FromQuery] GetPlatformAuditLogsQuery query)
    {
        var result = await Sender.Send(query with { PageSize = 10000, Page = 1 });
        var csv = new StringBuilder();
        csv.AppendLine("Id,EntityType,EntityId,Action,UserId,OwnerId,FoundationId,CreatedAt");
        foreach (var item in result.Items)
            csv.AppendLine($"{item.Id},{item.EntityType},{item.EntityId},{item.Action},{item.UserId},{item.OwnerId},{item.FoundationId},{item.CreatedAt:O}");
        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "platform-audit-log.csv");
    }
}
