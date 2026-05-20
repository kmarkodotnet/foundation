using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Interfaces.Services;
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
        var token = BuildToken(claims, signingCredentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static IEnumerable<Claim> BuildClaims(AppUser user)
    {
        return
        [
            new Claim(JwtRegisteredClaimNames.Sub, user.GoogleId),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
            new Claim("role", user.Role.ToString()),
            new Claim(ClaimTypeUserId, user.Id.ToString())
        ];
    }

    private SigningCredentials BuildSigningCredentials()
    {
        var keyBytes = Encoding.UTF8.GetBytes(_secretKey);
        var securityKey = new SymmetricSecurityKey(keyBytes);
        return new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
    }

    private JwtSecurityToken BuildToken(
        IEnumerable<Claim> claims,
        SigningCredentials signingCredentials)
    {
        return new JwtSecurityToken(
            issuer: _issuer,
            audience: null,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(_expirationHours),
            signingCredentials: signingCredentials);
    }
}
