using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrantManagement.API.Common;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public abstract class ApiControllerBase(ISender sender) : ControllerBase
{
    protected readonly ISender Sender = sender;
}
