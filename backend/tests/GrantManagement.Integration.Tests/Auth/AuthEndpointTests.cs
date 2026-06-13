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
using GrantManagement.Domain.Interfaces;

namespace GrantManagement.Integration.Tests.Auth;

[Collection("WebApi")]
public class AuthEndpointTests
{
    private readonly WebApiFixture _fx;

    public AuthEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-001 / US-006: Google OAuth Callback ─────────────────────────────

    [SkippableFact]
    public async Task GoogleCallback_ExistingActiveUser_Returns200WithAccessToken()
    {
        _fx.SkipIfDockerUnavailable();

        var googleId = $"gid-{Guid.NewGuid():N}";
        var email = $"existing-{Guid.NewGuid():N}@gmail.com";

        await using var seedCtx = _fx.CreateDbContext();
        var user = AppUser.CreateFromGoogle(googleId, email, "Existing User", null, UserRole.PalyazatiMunkatars);
        seedCtx.AppUsers.Add(user);
        await seedCtx.SaveChangesAsync();

        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync("valid-code", "http://localhost", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo(googleId, email, "Existing User", null));

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/google-callback",
            new { authorizationCode = "valid-code", redirectUri = "http://localhost" });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        json.GetProperty("expiresIn").GetInt32().Should().Be(28800);
        json.GetProperty("user").GetProperty("email").GetString().Should().Be(email);
    }

    [SkippableFact]
    public async Task GoogleCallback_UnknownEmail_Returns403WithNoInvitationDetail()
    {
        _fx.SkipIfDockerUnavailable();

        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo($"new-{Guid.NewGuid():N}", "noinvite@gmail.com", "No Invite", null));

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/google-callback",
            new { authorizationCode = "any-code", redirectUri = "http://localhost" });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("no-invitation");
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

    // ─── US-007: Accept Invitation ──────────────────────────────────────────────

    [SkippableFact]
    public async Task AcceptInvitation_ValidTokenAndMatchingEmail_Returns200WithAccessToken()
    {
        _fx.SkipIfDockerUnavailable();

        var invitationEmail = $"invite-{Guid.NewGuid():N}@test.local";
        var googleId = $"gid-accept-{Guid.NewGuid():N}";

        await using var seedCtx = _fx.CreateDbContext();
        var invitation = Invitation.Create(invitationEmail, UserRole.Megtekinto, 72);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync("accept-code", "http://localhost", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo(googleId, invitationEmail, "New User", null));

        _fx.EmailServiceMock.Reset();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/accept-invitation",
            new { authorizationCode = "accept-code", redirectUri = "http://localhost",
                  invitationToken = invitation.Token });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        json.GetProperty("user").GetProperty("email").GetString().Should().Be(invitationEmail);
        json.GetProperty("user").GetProperty("role").GetString().Should().Be("Megtekinto");
    }

    [SkippableFact]
    public async Task AcceptInvitation_ValidToken_CreatesUserWithInvitationRole()
    {
        _fx.SkipIfDockerUnavailable();

        var invitationEmail = $"role-{Guid.NewGuid():N}@test.local";
        var googleId = $"gid-role-{Guid.NewGuid():N}";

        await using var seedCtx = _fx.CreateDbContext();
        var invitation = Invitation.Create(invitationEmail, UserRole.PalyazatiMunkatars, 72);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo(googleId, invitationEmail, "New Worker", null));

        _fx.EmailServiceMock.Reset();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/accept-invitation",
            new { authorizationCode = "code", redirectUri = "http://localhost",
                  invitationToken = invitation.Token });

        await _fx.Client.SendAsync(req);

        await using var verifyCtx = _fx.CreateDbContext();
        var user = await verifyCtx.AppUsers.FirstOrDefaultAsync(u => u.Email == invitationEmail);
        user.Should().NotBeNull();
        user!.Role.Should().Be(UserRole.PalyazatiMunkatars);

        var acceptedInvitation = await verifyCtx.Invitations.FindAsync(invitation.Id);
        acceptedInvitation!.Status.Should().Be(InvitationStatus.Accepted);
    }

    [SkippableFact]
    public async Task AcceptInvitation_UnknownToken_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/accept-invitation",
            new { authorizationCode = "code", redirectUri = "http://localhost",
                  invitationToken = "nonexistenttoken00000000000000000" });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task AcceptInvitation_ExpiredToken_Returns410()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var invitation = Invitation.Create($"exp-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        invitation.MarkAsExpired();
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/accept-invitation",
            new { authorizationCode = "code", redirectUri = "http://localhost",
                  invitationToken = invitation.Token });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Gone);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("invitation-expired");
    }

    [SkippableFact]
    public async Task AcceptInvitation_RevokedToken_Returns410()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var invitation = Invitation.Create($"rev-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        invitation.Revoke();
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/accept-invitation",
            new { authorizationCode = "code", redirectUri = "http://localhost",
                  invitationToken = invitation.Token });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Gone);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("invitation-revoked");
    }

    [SkippableFact]
    public async Task AcceptInvitation_AlreadyAcceptedToken_Returns409()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var invitation = Invitation.Create($"acc-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        invitation.Accept();
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/accept-invitation",
            new { authorizationCode = "code", redirectUri = "http://localhost",
                  invitationToken = invitation.Token });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("invitation-already-accepted");
    }

    [SkippableFact]
    public async Task AcceptInvitation_EmailMismatch_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var invitationEmail = $"mismatch-{Guid.NewGuid():N}@test.local";
        await using var seedCtx = _fx.CreateDbContext();
        var invitation = Invitation.Create(invitationEmail, UserRole.Megtekinto, 72);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        _fx.GoogleAuthMock.Reset();
        _fx.GoogleAuthMock
            .Setup(s => s.ExchangeCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo("gid-wrong", "different@test.local", "Wrong User", null));

        _fx.EmailServiceMock.Reset();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/auth/accept-invitation",
            new { authorizationCode = "code", redirectUri = "http://localhost",
                  invitationToken = invitation.Token });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("email-mismatch");
    }
}
