using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Common.Attributes;

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class RequireRoleAttribute : Attribute
{
    public UserRole[] AllowedRoles { get; }

    public RequireRoleAttribute(params UserRole[] roles)
        => AllowedRoles = roles;
}
