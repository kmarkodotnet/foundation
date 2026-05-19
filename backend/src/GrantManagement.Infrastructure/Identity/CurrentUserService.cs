using System.Security.Claims;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace GrantManagement.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid UserId
    {
        get
        {
            var claim = User?.FindFirstValue("userId")
                ?? User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }
    }

    public string Email =>
        User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

    public UserRole Role
    {
        get
        {
            var roleClaim = User?.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(roleClaim, out var role) ? role : UserRole.Megtekinto;
        }
    }

    public string? IpAddress =>
        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public bool IsAuthenticated =>
        User?.Identity?.IsAuthenticated == true;

    public bool IsAdmin() => Role == UserRole.Admin;

    public bool HasRole(UserRole role) => Role == role;

    public bool HasAnyRole(params UserRole[] roles) => roles.Contains(Role);
}
