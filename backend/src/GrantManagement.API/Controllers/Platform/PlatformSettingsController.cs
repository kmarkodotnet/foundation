using GrantManagement.API.Common;
using GrantManagement.Application.Platform.Settings.Commands.UpdatePlatformSettings;
using GrantManagement.Application.Platform.Settings.Queries.GetPlatformSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Controllers.Platform;

[Route("api/v1/platform/settings")]
public class PlatformSettingsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Policy = "CanReadPlatform")]
    [ProducesResponseType(typeof(PlatformSettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings()
        => Ok(await Sender.Send(new GetPlatformSettingsQuery()));

    [HttpPatch]
    [Authorize(Policy = "IsPlatformAdmin")]
    [ProducesResponseType(typeof(UpdatePlatformSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdatePlatformSettingsCommand command)
        => Ok(await Sender.Send(command));
}
