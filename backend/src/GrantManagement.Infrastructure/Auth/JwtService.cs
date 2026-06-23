using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Interfaces.Services;
using GrantManagement.Domain.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GrantManagement.Infrastructure.Auth;

public sealed class JwtService : IJwtService
{
    private const string ClaimTypeUserId = "userId";

    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly int _expirationHours;

    public JwtService(IConfiguration configuration)
    {
        _secretKey = configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");

        _issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");

        _expirationHours = int.TryParse(configuration["Jwt:ExpirationHours"], out var hours)
            ? hours
            : 8;
    }

    public int ExpiresInSeconds => _expirationHours * 3600;

    public string GenerateToken(AppUser user)
    {
        var claims = BuildClaims(user);
        var signingCredentials = BuildSigningCredentials();
        var token = BuildTokenInternal(claims, signingCredentials, null);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateTokenForScope(
        AppUser user,
        string audience,
        Guid? ownerId = null,
        Guid? foundationId = null)
    {
        var claims = BuildScopeClaims(user, audience, ownerId, foundationId);
        var signingCredentials = BuildSigningCredentials();
        var token = BuildTokenInternal(claims, signingCredentials, audience);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateBreakGlassToken(AppUser platformAdmin, BreakGlassGrant grant)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, platformAdmin.GoogleId),
            new(JwtRegisteredClaimNames.Email, platformAdmin.Email),
            new(JwtRegisteredClaimNames.Name, platformAdmin.Name),
            new(ClaimTypeUserId, platformAdmin.Id.ToString()),
            new("scope", "owner"),
            new("aud", "owner"),
            new("owner_id", grant.TargetOwnerId.ToString()),
            new("break_glass_grant_id", grant.Id.ToString())
        };

        if (platformAdmin.PlatformRole.HasValue)
            claims.Add(new Claim("platform_role", platformAdmin.PlatformRole.Value.ToString()));

        var signingCredentials = BuildSigningCredentials();
        var token = BuildTokenInternal(claims, signingCredentials, "owner");
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static IEnumerable<Claim> BuildClaims(AppUser user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.GoogleId),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.Name),
            new("role", user.Role.ToString()),
            new(ClaimTypeUserId, user.Id.ToString())
        };

        if (user.PlatformRole.HasValue)
        {
            claims.Add(new Claim("platform_role", user.PlatformRole.Value.ToString()));
            claims.Add(new Claim("scope", "platform"));
            claims.Add(new Claim("aud", "platform"));
        }
        else if (user.OwnerRole.HasValue && user.OwnerId.HasValue)
        {
            claims.Add(new Claim("owner_role", user.OwnerRole.Value.ToString()));
            claims.Add(new Claim("scope", "owner"));
            claims.Add(new Claim("aud", "owner"));
            claims.Add(new Claim("owner_id", user.OwnerId.Value.ToString()));
        }

        return claims;
    }

    private static IEnumerable<Claim> BuildScopeClaims(
        AppUser user,
        string audience,
        Guid? ownerId,
        Guid? foundationId)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.GoogleId),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.Name),
            new(ClaimTypeUserId, user.Id.ToString()),
            new("scope", audience),
            new("aud", audience)
        };

        if (user.PlatformRole.HasValue)
            claims.Add(new Claim("platform_role", user.PlatformRole.Value.ToString()));

        if (user.OwnerRole.HasValue)
            claims.Add(new Claim("owner_role", user.OwnerRole.Value.ToString()));

        if (ownerId.HasValue)
            claims.Add(new Claim("owner_id", ownerId.Value.ToString()));

        if (foundationId.HasValue)
            claims.Add(new Claim("foundation_id", foundationId.Value.ToString()));

        var foundationRolesMap = user.FoundationAssignments
            .Where(a => a.IsActive)
            .ToDictionary(a => a.FoundationId.ToString(), a => a.FoundationRole.ToString());
        if (foundationRolesMap.Count > 0)
            claims.Add(new Claim("foundation_roles", JsonSerializer.Serialize(foundationRolesMap)));

        return claims;
    }

    private SigningCredentials BuildSigningCredentials()
    {
        var keyBytes = Encoding.UTF8.GetBytes(_secretKey);
        var securityKey = new SymmetricSecurityKey(keyBytes);
        return new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
    }

    private JwtSecurityToken BuildTokenInternal(
        IEnumerable<Claim> claims,
        SigningCredentials signingCredentials,
        string? audience)
    {
        return new JwtSecurityToken(
            issuer: _issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(_expirationHours),
            signingCredentials: signingCredentials);
    }
}
