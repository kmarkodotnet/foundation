using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.BudgetPlan;

[Collection("WebApi")]
public class BudgetPlanEndpointTests
{
    private readonly WebApiFixture _fx;

    public BudgetPlanEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-050: Create Budget Plan with Items ────────────────────────────────

    [SkippableFact]
    public async Task UpsertBudgetPlan_ValidItems_Returns200WithSummary()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            notes = "Éves rendezvény és eszközbeszerzés",
            items = new[]
            {
                new { id = (Guid?)null, name = "Nyári tábor", type = "Event", plannedAmount = 500_000m, description = (string?)"",       sortOrder = 1 },
                new { id = (Guid?)null, name = "Laptop",     type = "Asset", plannedAmount = 350_000m, description = (string?)"Dell XPS", sortOrder = 2 }
            }
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("applicationId").GetGuid().Should().Be(app.Id);
        json.GetProperty("totalPlanned").GetDecimal().Should().Be(850_000m);
        json.GetProperty("awardedAmount").GetDecimal().Should().Be(1_500_000m);
        json.GetProperty("items").GetArrayLength().Should().Be(2);
    }

    [SkippableFact]
    public async Task UpsertBudgetPlan_ApplicationNotWon_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            notes = (string?)null,
            items = new[]
            {
                new { id = (Guid?)null, name = "Tétel", type = "Other", plannedAmount = 100_000m, description = (string?)null, sortOrder = 1 }
            }
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task GetBudgetPlan_AfterUpsert_Returns200WithItems()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Create the budget plan first
        var upsertBody = new
        {
            applicationId = app.Id,
            notes = "Teszt terv",
            items = new[]
            {
                new { id = (Guid?)null, name = "Rendezvény", type = "Event", plannedAmount = 300_000m, description = (string?)null, sortOrder = 1 }
            }
        };
        using var upsertReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", upsertBody, token);
        (await _fx.Client.SendAsync(upsertReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        // GET the budget plan
        using var getReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/budget-plan", token: token);
        var getResponse = await _fx.Client.SendAsync(getReq);

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("notes").GetString().Should().Be("Teszt terv");
        json.GetProperty("items").GetArrayLength().Should().Be(1);
        json.GetProperty("items")[0].GetProperty("name").GetString().Should().Be("Rendezvény");
        json.GetProperty("items")[0].GetProperty("plannedAmount").GetDecimal().Should().Be(300_000m);
    }

    [SkippableFact]
    public async Task UpsertBudgetPlan_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new
        {
            notes = (string?)null,
            items = Array.Empty<object>()
        };

        using var req = new HttpRequestMessage(HttpMethod.Put,
            $"/api/v1/applications/{Guid.NewGuid()}/budget-plan")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── US-051: Edit and Delete Budget Items (via UpsertBudgetPlan) ─────────

    [SkippableFact]
    public async Task UpsertBudgetPlan_UpdateExistingItem_Returns200Updated()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // First upsert: create item without id
        var createBody = new
        {
            applicationId = app.Id,
            notes = (string?)null,
            items = new[] { new { id = (Guid?)null, name = "Eredeti tétel", type = "Asset", plannedAmount = 100_000m, description = (string?)null, sortOrder = 1 } }
        };
        using var createReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", createBody, token);
        var createResp = await _fx.Client.SendAsync(createReq);
        createResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var createJson = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var itemId = createJson.GetProperty("items")[0].GetProperty("id").GetGuid();

        // Second upsert: update the same item by passing its id
        var updateBody = new
        {
            applicationId = app.Id,
            notes = (string?)null,
            items = new[] { new { id = (Guid?)itemId, name = "Módosított tétel", type = "Asset", plannedAmount = 200_000m, description = "Frissítve", sortOrder = 1 } }
        };
        using var updateReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", updateBody, token);
        var updateResp = await _fx.Client.SendAsync(updateReq);

        updateResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updateJson = await updateResp.Content.ReadFromJsonAsync<JsonElement>();
        updateJson.GetProperty("items").GetArrayLength().Should().Be(1);
        updateJson.GetProperty("items")[0].GetProperty("id").GetGuid().Should().Be(itemId);
        updateJson.GetProperty("items")[0].GetProperty("name").GetString().Should().Be("Módosított tétel");
        updateJson.GetProperty("items")[0].GetProperty("plannedAmount").GetDecimal().Should().Be(200_000m);
    }

    [SkippableFact]
    public async Task UpsertBudgetPlan_OmitItem_Returns200WithItemRemoved()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // First upsert: create one item
        var createBody = new
        {
            applicationId = app.Id,
            notes = (string?)null,
            items = new[] { new { id = (Guid?)null, name = "Törölhető tétel", type = "Other", plannedAmount = 50_000m, description = (string?)null, sortOrder = 1 } }
        };
        using var createReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", createBody, token);
        (await _fx.Client.SendAsync(createReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        // Second upsert: send empty items list to remove all items
        var removeBody = new
        {
            applicationId = app.Id,
            notes = (string?)null,
            items = Array.Empty<object>()
        };
        using var removeReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", removeBody, token);
        var removeResp = await _fx.Client.SendAsync(removeReq);

        removeResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var removeJson = await removeResp.Content.ReadFromJsonAsync<JsonElement>();
        removeJson.GetProperty("items").GetArrayLength().Should().Be(0);
        removeJson.GetProperty("totalPlanned").GetDecimal().Should().Be(0m);
    }

    // ─── US-052: Approve Budget Plan (President) ──────────────────────────────

    [SkippableFact]
    public async Task ApproveBudgetPlan_AsElnok_Returns200WithApproval()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Elnok);

        // Create a budget plan first (required before approval)
        var upsertBody = new
        {
            applicationId = app.Id,
            notes = (string?)null,
            items = new[] { new { id = (Guid?)null, name = "Jóváhagyandó tétel", type = "Event", plannedAmount = 500_000m, description = (string?)null, sortOrder = 1 } }
        };
        using var upsertReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/budget-plan", upsertBody,
            _fx.GenerateJwt(userId, UserRole.Admin));
        (await _fx.Client.SendAsync(upsertReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        // Approve the BudgetPlan step
        var approveBody = new { isApproved = true, rejectionNote = (string?)null };
        using var approveReq = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/workflow/BudgetPlan/approve", approveBody, token);
        var approveResp = await _fx.Client.SendAsync(approveReq);

        approveResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await approveResp.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("stepType").GetString().Should().Be("BudgetPlan");
        json.GetProperty("approvedByUserId").GetGuid().Should().Be(userId);
    }

    [SkippableFact]
    public async Task ApproveBudgetPlan_AsPalyazatiMunkatars_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new { isApproved = true, rejectionNote = (string?)null };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/workflow/BudgetPlan/approve", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── Seed helpers ─────────────────────────────────────────────────────────

    private async Task<Domain.Entities.Application> SeedDraftApplicationAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Draft pályázat",
            granter.Id,
            new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(90) },
            userId);
        ctx.Applications.Add(app);

        await ctx.SaveChangesAsync();
        return app;
    }

    private async Task<Domain.Entities.Application> SeedWonApplicationAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Nyert pályázat",
            granter.Id,
            new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(90) },
            userId);

        app.RecordSubmission(
            new SubmissionStepData { SubmittedAt = DateTimeOffset.UtcNow.AddDays(-10), SubmittedByUserId = userId },
            userId);
        app.ApproveSubmission(userId);
        app.RecordResult(
            ApplicationResult.Won(DateOnly.FromDateTime(DateTime.Today.AddDays(-5)), new Money(1_500_000m, "HUF")),
            userId);

        ctx.Applications.Add(app);
        await ctx.SaveChangesAsync();
        return app;
    }
}
