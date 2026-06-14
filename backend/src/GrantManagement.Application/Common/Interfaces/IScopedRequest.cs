namespace GrantManagement.Application.Common.Interfaces;

public interface IScopedRequest
{
    ScopeRequirement GetScopeRequirement();
}

public record ScopeRequirement(Guid? OwnerId, Guid? FoundationId, string RequiredAudience);
