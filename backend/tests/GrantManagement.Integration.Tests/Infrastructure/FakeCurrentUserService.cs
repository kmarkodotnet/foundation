using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Integration.Tests.Infrastructure;

public sealed class FakeCurrentUserService : ICurrentUserService
{
    public FakeCurrentUserService(Guid userId, UserRole role = UserRole.Admin)
    {
        UserId = userId;
        Role = role;
    }

    public Guid UserId { get; }
    public string Email => "test@integration.local";
    public UserRole Role { get; }
    public string? IpAddress => null;
    public bool IsAuthenticated => true;
    public bool IsAdmin() => Role == UserRole.Admin;
    public bool HasRole(UserRole role) => Role == role;
    public bool HasAnyRole(params UserRole[] roles) => roles.Contains(Role);
}
