using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.Comments;

[Collection("WebApi")]
public class CommentEndpointTests
{
    private readonly WebApiFixture _fx;

    public CommentEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-095: Add Comment to Workflow Step ─────────────────────────────────

    [SkippableFact]
    public async Task AddComment_ValidPayload_Returns201()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        var body = new
        {
            applicationId = app.Id,
            workflowStepId = (Guid?)null,
            body = "A beadási határidőt meg kell erősíteni a pályáztatóval."
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/comments", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("applicationId").GetGuid().Should().Be(app.Id);
        json.GetProperty("body").GetString().Should()
            .Be("A beadási határidőt meg kell erősíteni a pályáztatóval.");
        json.GetProperty("authorId").GetGuid().Should().Be(userId);
        json.GetProperty("isDeleted").GetBoolean().Should().BeFalse();
    }

    [SkippableFact]
    public async Task AddComment_EmptyBody_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            workflowStepId = (Guid?)null,
            body = ""
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/comments", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task AddComment_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new { workflowStepId = (Guid?)null, body = "Megjegyzés" };

        using var req = new HttpRequestMessage(
            HttpMethod.Post, $"/api/v1/applications/{Guid.NewGuid()}/comments")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task GetComments_AfterAdd_ReturnsListWithBothComments()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        await AddCommentAsync(app.Id, "Első megjegyzés", token);
        await AddCommentAsync(app.Id, "Második megjegyzés", token);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/comments", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await response.Content.ReadFromJsonAsync<JsonElement>())
            .EnumerateArray().ToList();
        items.Should().HaveCountGreaterThanOrEqualTo(2);
        items.Should().Contain(c => c.GetProperty("body").GetString() == "Első megjegyzés");
        items.Should().Contain(c => c.GetProperty("body").GetString() == "Második megjegyzés");
        // Oldest first — Első appears before Második
        var bodies = items.Select(c => c.GetProperty("body").GetString()).ToList();
        bodies.IndexOf("Első megjegyzés").Should().BeLessThan(bodies.IndexOf("Második megjegyzés"));
    }

    [SkippableFact]
    public async Task GetComments_FilteredByStepId_ReturnsOnlyStepComments()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Resolve a workflow step ID
        using var appReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}", token: token);
        var appJson = await (await _fx.Client.SendAsync(appReq))
            .Content.ReadFromJsonAsync<JsonElement>();
        var callStepId = appJson
            .GetProperty("workflowSteps")
            .EnumerateArray()
            .First(s => s.GetProperty("stepType").GetString() == "Call")
            .GetProperty("id").GetGuid();

        // Add comment linked to step
        var stepBody = new { applicationId = app.Id, workflowStepId = callStepId, body = "Lépéshez kötött" };
        using var stepReq = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/comments", stepBody, token);
        (await _fx.Client.SendAsync(stepReq)).StatusCode.Should().Be(HttpStatusCode.Created);

        // Add comment without step
        await AddCommentAsync(app.Id, "Általános megjegyzés", token);

        // GET filtered by stepId
        using var listReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/comments?stepId={callStepId}",
            token: token);
        var listResp = await _fx.Client.SendAsync(listReq);

        listResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await listResp.Content.ReadFromJsonAsync<JsonElement>())
            .EnumerateArray().ToList();
        items.Should().AllSatisfy(c =>
            c.GetProperty("workflowStepId").GetGuid().Should().Be(callStepId));
    }

    // ─── US-096: Edit and Delete Own Comment ─────────────────────────────────

    [SkippableFact]
    public async Task UpdateComment_ByAuthor_Returns200WithUpdatedBody()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var commentId = await AddCommentAsync(app.Id, "Eredeti szöveg", token);

        var updateBody = new
        {
            applicationId = app.Id,
            commentId,
            body = "Javított szöveg"
        };
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/comments/{commentId}",
            updateBody, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("body").GetString().Should().Be("Javított szöveg");
        json.GetProperty("id").GetGuid().Should().Be(commentId);
    }

    [SkippableFact]
    public async Task UpdateComment_ByNonAuthor_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userA);
        var tokenA = _fx.GenerateJwt(userA, UserRole.PalyazatiMunkatars);
        var tokenB = _fx.GenerateJwt(userB, UserRole.PalyazatiMunkatars);

        var commentId = await AddCommentAsync(app.Id, "A-féle megjegyzés", tokenA);

        var updateBody = new { applicationId = app.Id, commentId, body = "B próbálja módosítani" };
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/comments/{commentId}",
            updateBody, tokenB);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task DeleteComment_ByAuthor_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        var commentId = await AddCommentAsync(app.Id, "Törölhető megjegyzés", token);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}/comments/{commentId}",
            token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task DeleteComment_ByNonAuthor_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userA);
        var tokenA = _fx.GenerateJwt(userA, UserRole.PalyazatiMunkatars);
        var tokenB = _fx.GenerateJwt(userB, UserRole.Penzugyes);

        var commentId = await AddCommentAsync(app.Id, "A megjegyzése", tokenA);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}/comments/{commentId}",
            token: tokenB);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task DeleteComment_ByAdmin_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var ownerUserId = Guid.NewGuid();
        var adminUserId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(ownerUserId);
        var ownerToken = _fx.GenerateJwt(ownerUserId, UserRole.PalyazatiMunkatars);
        var adminToken = _fx.GenerateJwt(adminUserId, UserRole.Admin);

        var commentId = await AddCommentAsync(app.Id, "Admin törölheti", ownerToken);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}/comments/{commentId}",
            token: adminToken);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<Guid> AddCommentAsync(Guid applicationId, string body, string token)
    {
        var payload = new { applicationId, workflowStepId = (Guid?)null, body };
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{applicationId}/comments", payload, token);
        var resp = await _fx.Client.SendAsync(req);
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
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
}
