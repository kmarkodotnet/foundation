using GrantManagement.API.Common;
using GrantManagement.Application.OwnerAdministration.Reports.Queries.GetOwnerDashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Owner;

[Route("api/v1/owner/reports")]
public class OwnerReportsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("dashboard")]
    [Authorize(Policy = "CanReadOwner")]
    [ProducesResponseType(typeof(OwnerDashboardResponse), StatusCodes.Status200OK)]
    [ResponseCache(Duration = 300)]
    public async Task<IActionResult> GetDashboard()
        => Ok(await Sender.Send(new GetOwnerDashboardQuery()));
}
