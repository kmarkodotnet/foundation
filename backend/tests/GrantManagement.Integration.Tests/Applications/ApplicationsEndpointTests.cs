using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Integration.Tests.Applications;

[Collection("WebApi")]
public class ApplicationsEndpointTests
{
    private readonly WebApiFixture _fx;

    public ApplicationsEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-010: Create Application ──────────────────────────────────────────

    [SkippableFact]
    public async Task CreateApplication_ValidPayload_Returns201WithNineWorkflowSteps()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var granterId = await SeedGranterAsync();
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            title = "Integrációs teszt pályázat",
            granterId,
            submissionDeadline = "2027-06-01T00:00:00Z",
            identifier = "IT-2027-001"
        };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/applications", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("Draft");
        json.GetProperty("workflowSteps").GetArrayLength().Should().Be(9);

        var steps = json.GetProperty("workflowSteps").EnumerateArray().ToList();
        steps.Should().Contain(s => s.GetProperty("stepType").GetString() == "Call");
        steps.Should().Contain(s => s.GetProperty("stepType").GetString() == "Submission");
    }

    [SkippableFact]
    public async Task CreateApplication_NonExistentGranter_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var body = new
        {
            title = "Nem létező pályáztató",
            granterId = Guid.NewGuid(),
            submissionDeadline = "2027-06-01T00:00:00Z"
        };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/applications", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── US-011: Update Application ──────────────────────────────────────────

    [SkippableFact]
    public async Task UpdateApplication_ValidPayload_Returns200Updated()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var (_, app) = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            title = "Módosított cím",
            identifier = (string?)null,
            description = (string?)null,
            submissionDeadline = "2028-01-01T00:00:00Z",
            minAmount = (decimal?)null,
            maxAmount = (decimal?)null,
            spendingDeadline = (string?)null,
            applicationTypeId = (Guid?)null,
            otherMetadata = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("title").GetString().Should().Be("Módosított cím");
    }

    [SkippableFact]
    public async Task UpdateApplication_LockedApplication_NonAdmin_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var (_, app) = await SeedClosedLostApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            title = "Próba módosítás locked",
            identifier = (string?)null,
            description = (string?)null,
            submissionDeadline = "2028-01-01T00:00:00Z",
            minAmount = (decimal?)null,
            maxAmount = (decimal?)null,
            spendingDeadline = (string?)null,
            applicationTypeId = (Guid?)null,
            otherMetadata = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── US-012: Get Application Detail ──────────────────────────────────────

    [SkippableFact]
    public async Task GetApplicationDetail_WithValidJwt_Returns200WithWorkflowSteps()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var (granter, app) = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        using var req = WebApiFixture.BuildRequest(HttpMethod.Get, $"/api/v1/applications/{app.Id}", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("id").GetGuid().Should().Be(app.Id);
        json.GetProperty("status").GetString().Should().Be("Draft");
        json.GetProperty("workflowSteps").GetArrayLength().Should().Be(9);
    }

    [SkippableFact]
    public async Task GetApplicationDetail_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/applications/{Guid.NewGuid()}");
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task GetApplicationDetail_NonExistentId_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Megtekinto);
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{Guid.NewGuid()}", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── US-013: Archive Application ─────────────────────────────────────────

    [SkippableFact]
    public async Task ArchiveApplication_AsAdmin_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var (_, app) = await SeedClosedLostApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task ArchiveApplication_NonAdmin_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var (_, app) = await SeedClosedLostApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task ArchivedApplication_DoesNotAppearInDefaultList()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var (_, app) = await SeedClosedLostApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // Archive it
        using var deleteReq = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}", token: token);
        var deleteResponse = await _fx.Client.SendAsync(deleteReq);
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify not in default list
        using var listReq = WebApiFixture.BuildRequest(HttpMethod.Get, "/api/v1/applications", token: token);
        var listResponse = await _fx.Client.SendAsync(listReq);

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.GetProperty("items").EnumerateArray();
        items.Should().NotContain(i => i.GetProperty("id").GetGuid() == app.Id);
    }

    // ─── Seed helpers ─────────────────────────────────────────────────────────

    private async Task<Guid> SeedGranterAsync()
    {
        await using var ctx = _fx.CreateDbContext();
        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);
        await ctx.SaveChangesAsync();
        return granter.Id;
    }

    private async Task<(Granter granter, Domain.Entities.Application app)> SeedDraftApplicationAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Teszt pályázat",
            granter.Id,
            new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(90) },
            userId);
        ctx.Applications.Add(app);

        await ctx.SaveChangesAsync();
        return (granter, app);
    }

    private async Task<(Granter granter, Domain.Entities.Application app)> SeedClosedLostApplicationAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Archív Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Archivált pályázat",
            granter.Id,
            new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(90) },
            userId);

        app.RecordSubmission(
            new SubmissionStepData { SubmittedAt = DateTimeOffset.UtcNow.AddDays(-10), SubmittedByUserId = userId },
            userId);
        app.ApproveSubmission(userId);
        app.RecordResult(
            ApplicationResult.Lost(DateOnly.FromDateTime(DateTime.Today.AddDays(-5))),
            userId);
        app.ManualClose();

        ctx.Applications.Add(app);
        await ctx.SaveChangesAsync();
        return (granter, app);
    }
}
