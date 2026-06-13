using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Integration.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Integration.Tests.Invitations;

[Collection("WebApi")]
public class InvitationsEndpointTests
{
    private readonly WebApiFixture _fx;

    public InvitationsEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── GET /api/v1/invitations ─────────────────────────────────────────────────

    [SkippableFact]
    public async Task GetInvitations_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/invitations");

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task GetInvitations_NonAdmin_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var user = AppUser.CreateFromGoogle(
            $"gid-get-{Guid.NewGuid():N}", $"worker-{Guid.NewGuid():N}@test.local",
            "Worker", null, UserRole.PalyazatiMunkatars);
        seedCtx.AppUsers.Add(user);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(user.Id, user.Role, user.Email);
        using var req = WebApiFixture.BuildRequest(HttpMethod.Get, "/api/v1/invitations", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task GetInvitations_AsAdmin_Returns200WithList()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-admin-{Guid.NewGuid():N}", $"admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        var email = $"listtest-{Guid.NewGuid():N}@test.local";
        var invitation = Invitation.Create(email, UserRole.Megtekinto, 72);
        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(HttpMethod.Get, "/api/v1/invitations", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetArrayLength().Should().BeGreaterThanOrEqualTo(1);
    }

    [SkippableFact]
    public async Task GetInvitations_FilterByStatus_ReturnsOnlyMatchingInvitations()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-filter-{Guid.NewGuid():N}", $"filteradmin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);

        var pending = Invitation.Create($"pending-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        var expired = Invitation.Create($"expired-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        expired.MarkAsExpired();

        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.AddRange(pending, expired);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, "/api/v1/invitations?status=Pending", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in json.EnumerateArray())
        {
            item.GetProperty("status").GetString().Should().Be("Pending");
        }
    }

    // ─── POST /api/v1/invitations ────────────────────────────────────────────────

    [SkippableFact]
    public async Task CreateInvitation_AsAdmin_Returns201WithInvitation()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-create-{Guid.NewGuid():N}", $"create-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        seedCtx.AppUsers.Add(admin);
        await seedCtx.SaveChangesAsync();

        _fx.EmailServiceMock.Reset();
        _fx.EmailServiceMock
            .Setup(s => s.SendInvitationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var targetEmail = $"newinvite-{Guid.NewGuid():N}@test.local";
        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/invitations",
            new { email = targetEmail, role = "Megtekinto" }, token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("email").GetString().Should().Be(targetEmail);
        json.GetProperty("role").GetString().Should().Be("Megtekinto");
        json.GetProperty("status").GetString().Should().Be("Pending");

        _fx.EmailServiceMock.Verify(
            s => s.SendInvitationAsync(targetEmail, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task CreateInvitation_DuplicatePending_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var targetEmail = $"dup-{Guid.NewGuid():N}@test.local";

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-dup-{Guid.NewGuid():N}", $"dup-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        var existing = Invitation.Create(targetEmail, UserRole.Megtekinto, 72);
        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.Add(existing);
        await seedCtx.SaveChangesAsync();

        _fx.EmailServiceMock.Reset();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/invitations",
            new { email = targetEmail, role = "Megtekinto" }, token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task CreateInvitation_InvalidEmail_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-inv-{Guid.NewGuid():N}", $"inv-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        seedCtx.AppUsers.Add(admin);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/invitations",
            new { email = "not-an-email", role = "Megtekinto" }, token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task CreateInvitation_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/invitations",
            new { email = "test@test.local", role = "Megtekinto" });

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── PUT /api/v1/invitations/{id}/revoke ─────────────────────────────────────

    [SkippableFact]
    public async Task RevokeInvitation_PendingInvitation_Returns200WithRevokedStatus()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-rev-{Guid.NewGuid():N}", $"rev-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        var invitation = Invitation.Create($"revoke-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/invitations/{invitation.Id}/revoke", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("Revoked");
    }

    [SkippableFact]
    public async Task RevokeInvitation_NotFound_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-revnf-{Guid.NewGuid():N}", $"revnf-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        seedCtx.AppUsers.Add(admin);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/invitations/{Guid.NewGuid()}/revoke", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task RevokeInvitation_AlreadyAccepted_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-revacc-{Guid.NewGuid():N}", $"revacc-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        var invitation = Invitation.Create($"accepted-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        invitation.Accept();
        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/invitations/{invitation.Id}/revoke", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ─── POST /api/v1/invitations/{id}/resend ────────────────────────────────────

    [SkippableFact]
    public async Task ResendInvitation_ExpiredInvitation_Returns200WithPendingStatus()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-res-{Guid.NewGuid():N}", $"res-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        var invitation = Invitation.Create($"resend-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        invitation.MarkAsExpired();
        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        _fx.EmailServiceMock.Reset();
        _fx.EmailServiceMock
            .Setup(s => s.SendInvitationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/invitations/{invitation.Id}/resend", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("Pending");

        _fx.EmailServiceMock.Verify(
            s => s.SendInvitationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ResendInvitation_PendingInvitation_Returns200AndSendsEmail()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-resp-{Guid.NewGuid():N}", $"resp-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        var invitation = Invitation.Create($"resendp-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        _fx.EmailServiceMock.Reset();
        _fx.EmailServiceMock
            .Setup(s => s.SendInvitationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/invitations/{invitation.Id}/resend", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        _fx.EmailServiceMock.Verify(
            s => s.SendInvitationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ResendInvitation_AcceptedInvitation_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-resacc-{Guid.NewGuid():N}", $"resacc-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        var invitation = Invitation.Create($"resendacc-{Guid.NewGuid():N}@test.local", UserRole.Megtekinto, 72);
        invitation.Accept();
        seedCtx.AppUsers.Add(admin);
        seedCtx.Invitations.Add(invitation);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/invitations/{invitation.Id}/resend", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task ResendInvitation_NotFound_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        await using var seedCtx = _fx.CreateDbContext();
        var admin = AppUser.CreateFromGoogle(
            $"gid-resnf-{Guid.NewGuid():N}", $"resnf-admin-{Guid.NewGuid():N}@test.local",
            "Admin", null, UserRole.Admin);
        seedCtx.AppUsers.Add(admin);
        await seedCtx.SaveChangesAsync();

        var token = _fx.GenerateJwt(admin.Id, admin.Role, admin.Email);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/invitations/{Guid.NewGuid()}/resend", token: token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task ResendInvitation_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/invitations/{Guid.NewGuid()}/resend");

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
