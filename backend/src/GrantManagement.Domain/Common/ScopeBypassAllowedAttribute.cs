namespace GrantManagement.Domain.Common;

[AttributeUsage(AttributeTargets.Method)]
public sealed class ScopeBypassAllowedAttribute : Attribute
{
    public string Reason { get; }
    public ScopeBypassAllowedAttribute(string reason) => Reason = reason;
}
