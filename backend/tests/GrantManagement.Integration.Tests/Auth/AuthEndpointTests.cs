using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Interfaces.Services;
using GrantManagement.Integration.Tests.Infrastructure;
using Moq;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Integration.Tests.Auth;

[Collection("WebApi")]
public class AuthEndpointTests
{
    private readonly WebApiFixture _fx;

    public AuthEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-001: Google OAuth Callback ──────────────────────────────────────

    [SkippableFact]
    public async Task GoogleCallback_ValidCode_Returns200WithAccessToken()
    {
        _fx.SkipIfDockerUnavailable();
        _fx.GoogleAuthMock.Reset();

        var googleId = $"gid-{Guid.NewGuid():N}";
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync("valid-code", "http://localhost", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo(googleId, "newuser@gmail.com", "New User", null));

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/google-callback",
            new { authorizationCode = "valid-code", redirectUri = "http://localhost" });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        json.GetProperty("expiresIn").GetInt32().Should().Be(28800);
        json.GetProperty("user").GetProperty("email").GetString().Should().Be("newuser@gmail.com");
    }

    [SkippableFact]
    public async Task GoogleCallback_FirstNewUserAfterExistingAdmin_CreatesWithMegtekintoRole()
    {
        _fx.SkipIfDockerUnavailable();

        // Seed an Admin so the next user is NOT the first ever
        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"admin-{Guid.NewGuid():N}", "admin-seed@test.local", "Admin Seed", null, UserRole.Admin);
        seedCtx.AppUsers.Add(admin);
        await seedCtx.SaveChangesAsync();

        var newGoogleId = $"new-{Guid.NewGuid():N}";
        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo(newGoogleId, "newcomer@gmail.com", "New Comer", null));

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/google-callback",
            new { authorizationCode = "any-code", redirectUri = "http://localhost" });

        var response = await _fx.Client.SendAsync(req);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var verifyCtx = _fx.CreateDbContext();
        var created = await verifyCtx.AppUsers.FirstAsync(u => u.GoogleId == newGoogleId);
        created.Role.Should().Be(UserRole.Megtekinto);
    }

    [SkippableFact]
    public async Task GoogleCallback_InactiveUser_Returns403WithInactiveMessage()
    {
        _fx.SkipIfDockerUnavailable();

        var googleId = $"inactive-{Guid.NewGuid():N}";
        await using var seedCtx = _fx.CreateDbContext();
        var user = AppUser.CreateFromGoogle(
            googleId, "inactive@gmail.com", "Inactive User", null, UserRole.Megtekinto);
        user.Deactivate();
        seedCtx.AppUsers.Add(user);
        await seedCtx.SaveChangesAsync();

        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo(googleId, "inactive@gmail.com", "Inactive User", null));

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/google-callback",
            new { authorizationCode = "inactive-code", redirectUri = "http://localhost" });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("inaktív");
    }

    [SkippableFact]
    public async Task GoogleCallback_GoogleServiceThrowsUnauthorized_Returns401()
    {
        _fx.SkipIfDockerUnavailable();
        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException("Google token exchange failed."));

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/google-callback",
            new { authorizationCode = "bad-code", redirectUri = "http://localhost" });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── US-002: Logout ──────────────────────────────────────────────────────

    [SkippableFact]
    public async Task Logout_WithValidJwt_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var user = AppUser.CreateFromGoogle(
            $"logout-{Guid.NewGuid():N}", "logout@test.local", "Logout User", null, UserRole.Megtekinto);
        seedCtx.AppUsers.Add(user);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(user.Id, user.Role, "logout@test.local");
        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/logout", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task Logout_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── US-004: Get Current User ────────────────────────────────────────────

    [SkippableFact]
    public async Task GetCurrentUser_WithValidJwt_Returns200WithProfile()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var user = AppUser.CreateFromGoogle(
            $"me-{Guid.NewGuid():N}", "me@test.local", "Me User", null, UserRole.Admin);
        seedCtx.AppUsers.Add(user);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(user.Id, user.Role, "me@test.local");
        using var req = WebApiFixture.BuildRequest(HttpMethod.Get, "/api/v1/auth/me", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("email").GetString().Should().Be("me@test.local");
        json.GetProperty("role").GetString().Should().Be("Admin");
        json.GetProperty("id").GetGuid().Should().Be(user.Id);
    }

    [SkippableFact]
    public async Task GetCurrentUser_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── US-005: Update Notification Preferences ─────────────────────────────

    [SkippableFact]
    public async Task UpdateNotificationPreferences_WithValidJwt_Returns200WithUpdatedPrefs()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var user = AppUser.CreateFromGoogle(
            $"notif-{Guid.NewGuid():N}", "notif@test.local", "Notif User", null, UserRole.Admin);
        seedCtx.AppUsers.Add(user);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(user.Id, user.Role, "notif@test.local");
        var body = new
        {
            emailOnDeadlineApproaching = true,
            emailOnDeadlineMissed = false,
            emailOnResultRecorded = true,
            emailOnApprovalRequired = false,
            emailOnNewComment = true,
            emailOnDocumentUploaded = false
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, "/api/v1/auth/me/notification-preferences", body, token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("emailOnDeadlineApproaching").GetBoolean().Should().BeTrue();
        json.GetProperty("emailOnDeadlineMissed").GetBoolean().Should().BeFalse();
        json.GetProperty("emailOnResultRecorded").GetBoolean().Should().BeTrue();
        json.GetProperty("emailOnNewComment").GetBoolean().Should().BeTrue();
    }

    [SkippableFact]
    public async Task UpdateNotificationPreferences_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, "/api/v1/auth/me/notification-preferences",
            new { emailOnDeadlineApproaching = true, emailOnDeadlineMissed = false,
                  emailOnResultRecorded = true, emailOnApprovalRequired = false,
                  emailOnNewComment = false, emailOnDocumentUploaded = false });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
