using System.Net;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.Auth;

[Collection("WebApi")]
public class RbacTests
{
    private readonly WebApiFixture _fx;

    public RbacTests(WebApiFixture fx) => _fx = fx;

    // ─── US-003: RBAC / Authorization ────────────────────────────────────────

    [SkippableFact]
    public async Task GetApplications_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/applications");

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task CreateApplication_WithMegtekintoRole_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        var body = new
        {
            title = "RBAC teszt pályázat",
            granterId = Guid.NewGuid(),          // bármilyen guid — auth előbb megbukik
            submissionDeadline = "2027-06-01T00:00:00Z"
        };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/applications", body, token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task CreateApplication_WithPalyazatiMunkatarsRole_Returns201()
    {
        _fx.SkipIfDockerUnavailable();

        // Seed granter
        await using var seedCtx = _fx.CreateDbContext();
        var granter = Granter.Create(
            $"Teszt Pályáztató {Guid.NewGuid():N}",
            description: null,
            ContactInfo.Empty);
        seedCtx.Granters.Add(granter);
        await seedCtx.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            title = "PalyazatiMunkatars teszt pályázat",
            granterId = granter.Id,
            submissionDeadline = "2027-06-01T00:00:00Z"
        };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/applications", body, token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [SkippableFact]
    public async Task ForbiddenException_MappedTo403WithRfc7807Body()
    {
        _fx.SkipIfDockerUnavailable();

        // Megtekinto nem hozhat létre pályázatot → ForbiddenException → 403 RFC 7807
        var userId = Guid.NewGuid();
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        var body = new
        {
            title = "RFC 7807 teszt",
            granterId = Guid.NewGuid(),
            submissionDeadline = "2027-06-01T00:00:00Z"
        };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/applications", body, token);

        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var problemBody = await response.Content.ReadAsStringAsync();
        problemBody.Should().Contain("403");
    }
}
