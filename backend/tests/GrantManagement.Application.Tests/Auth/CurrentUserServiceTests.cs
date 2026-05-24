using System.Security.Claims;
using FluentAssertions;
using GrantManagement.Domain.Enums;
using GrantManagement.Infrastructure.Identity;
using Microsoft.AspNetCore.Http;
using Moq;

namespace GrantManagement.Application.Tests.Auth;

public class CurrentUserServiceTests
{
    private static CurrentUserService CreateSut(IEnumerable<Claim> claims, bool isAuthenticated = true)
    {
        var identity = new ClaimsIdentity(claims, isAuthenticated ? "Bearer" : null);
        var principal = new ClaimsPrincipal(identity);

        var mockHttpContext = new Mock<HttpContext>();
        mockHttpContext.Setup(c => c.User).Returns(principal);

        var mockAccessor = new Mock<IHttpContextAccessor>();
        mockAccessor.Setup(a => a.HttpContext).Returns(mockHttpContext.Object);

        return new CurrentUserService(mockAccessor.Object);
    }

    [Fact]
    public void UserId_WhenUserIdClaimPresent_ShouldReturnParsedGuid()
    {
        var expectedId = Guid.NewGuid();
        var sut = CreateSut([new Claim("userId", expectedId.ToString())]);

        sut.UserId.Should().Be(expectedId);
    }

    [Fact]
    public void UserId_WhenUserIdClaimMissing_ShouldReturnGuidEmpty()
    {
        var sut = CreateSut([]);

        sut.UserId.Should().Be(Guid.Empty);
    }

    [Fact]
    public void Role_WhenRoleClaimIsAdmin_ShouldReturnAdminRole()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.Admin.ToString())]);

        sut.Role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public void Role_WhenRoleClaimIsPalyazatiMunkatars_ShouldReturnCorrectRole()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.PalyazatiMunkatars.ToString())]);

        sut.Role.Should().Be(UserRole.PalyazatiMunkatars);
    }

    [Fact]
    public void Role_WhenRoleClaimIsMissing_ShouldDefaultToMegtekinto()
    {
        var sut = CreateSut([]);

        sut.Role.Should().Be(UserRole.Megtekinto);
    }

    [Fact]
    public void Email_WhenEmailClaimPresent_ShouldReturnEmail()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Email, "user@test.com")]);

        sut.Email.Should().Be("user@test.com");
    }

    [Fact]
    public void Email_WhenEmailClaimMissing_ShouldReturnEmptyString()
    {
        var sut = CreateSut([]);

        sut.Email.Should().BeEmpty();
    }

    [Fact]
    public void IsAuthenticated_WhenBearerAuthenticationUsed_ShouldReturnTrue()
    {
        var sut = CreateSut([new Claim("userId", Guid.NewGuid().ToString())], isAuthenticated: true);

        sut.IsAuthenticated.Should().BeTrue();
    }

    [Fact]
    public void IsAuthenticated_WhenNoAuthenticationScheme_ShouldReturnFalse()
    {
        var sut = CreateSut([], isAuthenticated: false);

        sut.IsAuthenticated.Should().BeFalse();
    }

    [Fact]
    public void IsAdmin_WhenRoleIsAdmin_ShouldReturnTrue()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.Admin.ToString())]);

        sut.IsAdmin().Should().BeTrue();
    }

    [Fact]
    public void IsAdmin_WhenRoleIsNotAdmin_ShouldReturnFalse()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.Megtekinto.ToString())]);

        sut.IsAdmin().Should().BeFalse();
    }

    [Fact]
    public void HasRole_WhenRoleMatches_ShouldReturnTrue()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.Elnok.ToString())]);

        sut.HasRole(UserRole.Elnok).Should().BeTrue();
    }

    [Fact]
    public void HasRole_WhenRoleDoesNotMatch_ShouldReturnFalse()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.Elnok.ToString())]);

        sut.HasRole(UserRole.Penzugyes).Should().BeFalse();
    }

    [Fact]
    public void HasAnyRole_WhenOneRoleMatches_ShouldReturnTrue()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.Penzugyes.ToString())]);

        sut.HasAnyRole(UserRole.Admin, UserRole.Penzugyes).Should().BeTrue();
    }

    [Fact]
    public void HasAnyRole_WhenNoRoleMatches_ShouldReturnFalse()
    {
        var sut = CreateSut([new Claim(ClaimTypes.Role, UserRole.Megtekinto.ToString())]);

        sut.HasAnyRole(UserRole.Admin, UserRole.Elnok).Should().BeFalse();
    }
}
