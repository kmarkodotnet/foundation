using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid UserId { get; }
    string Email { get; }
    UserRole Role { get; }
    string? IpAddress { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin();
    bool HasRole(UserRole role);
    bool HasAnyRole(params UserRole[] roles);
}
