using System.Security.Claims;
using System.Text.Json;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Tenancy.Enums;
using Microsoft.AspNetCore.Http;

namespace GrantManagement.Infrastructure.Auth;

public sealed class CurrentScopeService : ICurrentScopeService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentScopeService(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string Audience => User?.FindFirstValue("aud") ?? "business";

    public Guid? OwnerId
    {
        get
        {
            var raw = User?.FindFirstValue("owner_id");
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public Guid? FoundationId
    {
        get
        {
            var raw = User?.FindFirstValue("foundation_id");
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public PlatformRole? PlatformRole
    {
        get
        {
            var raw = User?.FindFirstValue("platform_role");
            return Enum.TryParse<PlatformRole>(raw, out var r) ? r : null;
        }
    }

    public OwnerRole? OwnerRole
    {
        get
        {
            var raw = User?.FindFirstValue("owner_role");
            return Enum.TryParse<OwnerRole>(raw, out var r) ? r : null;
        }
    }

    public IReadOnlyDictionary<Guid, FoundationRole> FoundationRoles
    {
        get
        {
            var raw = User?.FindFirstValue("foundation_roles");
            if (string.IsNullOrEmpty(raw))
                return new Dictionary<Guid, FoundationRole>();
            try
            {
                return JsonSerializer.Deserialize<Dictionary<Guid, FoundationRole>>(raw)
                    ?? new Dictionary<Guid, FoundationRole>();
            }
            catch
            {
                return new Dictionary<Guid, FoundationRole>();
            }
        }
    }

    public Guid? BreakGlassGrantId
    {
        get
        {
            var raw = User?.FindFirstValue("break_glass_grant_id");
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public bool CanAccessOwner(Guid ownerId)
    {
        if (Audience == "platform") return true;
        return OwnerId == ownerId;
    }

    public bool CanAccessFoundation(Guid foundationId)
    {
        if (Audience == "platform") return true;
        if (FoundationId == foundationId) return true;
        return FoundationRoles.ContainsKey(foundationId);
    }
}
