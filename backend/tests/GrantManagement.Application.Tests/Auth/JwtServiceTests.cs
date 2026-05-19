using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Infrastructure.Auth;
using Microsoft.Extensions.Configuration;

namespace GrantManagement.Application.Tests.Auth;

public class JwtServiceTests
{
    private const string TestSecretKey = "this-is-a-test-secret-key-at-least-32-chars-long!";
    private const string TestIssuer = "test.issuer.hu";
    private const int TestExpirationHours = 8;

    private readonly JwtService _sut;

    public JwtServiceTests()
    {
        var configuration = BuildTestConfiguration();
        _sut = new JwtService(configuration);
    }

    [Fact]
    public void GenerateToken_ShouldReturnTokenContainingSubClaim()
    {
        var user = CreateTestUser();

        var token = _sut.GenerateToken(user);

        var claims = ParseToken(token);
        claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.GoogleId);
    }

    [Fact]
    public void GenerateToken_ShouldReturnTokenContainingEmailClaim()
    {
        var user = CreateTestUser();

        var token = _sut.GenerateToken(user);

        var claims = ParseToken(token);
        claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
    }

    [Fact]
    public void GenerateToken_ShouldReturnTokenContainingRoleClaim()
    {
        var user = CreateTestUser();

        var token = _sut.GenerateToken(user);

        var claims = ParseToken(token);
        claims.Should().Contain(c =>
            (c.Type == ClaimTypes.Role || c.Type == "role") &&
            c.Value == user.Role.ToString());
    }

    [Fact]
    public void GenerateToken_ShouldReturnTokenContainingUserIdClaim()
    {
        var user = CreateTestUser();

        var token = _sut.GenerateToken(user);

        var claims = ParseToken(token);
        claims.Should().Contain(c => c.Type == "userId" && c.Value == user.Id.ToString());
    }

    [Fact]
    public void GenerateToken_ShouldSetExpirationToConfiguredHours()
    {
        var user = CreateTestUser();
        var before = DateTime.UtcNow;

        var token = _sut.GenerateToken(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var after = DateTime.UtcNow;

        jwt.ValidTo.Should().BeAfter(before.AddHours(TestExpirationHours - 1));
        jwt.ValidTo.Should().BeBefore(after.AddHours(TestExpirationHours + 1));
    }

    [Fact]
    public void ExpiresInSeconds_ShouldReturn28800ForEightHours()
    {
        _sut.ExpiresInSeconds.Should().Be(28800);
    }

    private static AppUser CreateTestUser()
    {
        return AppUser.CreateFromGoogle(
            "google-sub-123",
            "user@test.com",
            "Test User",
            "https://example.com/pic.jpg",
            UserRole.PalyazatiMunkatars);
    }

    private static IEnumerable<Claim> ParseToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        return jwt.Claims;
    }

    private static IConfiguration BuildTestConfiguration()
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:SecretKey"] = TestSecretKey,
            ["Jwt:Issuer"] = TestIssuer,
            ["Jwt:ExpirationHours"] = TestExpirationHours.ToString()
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }
}
