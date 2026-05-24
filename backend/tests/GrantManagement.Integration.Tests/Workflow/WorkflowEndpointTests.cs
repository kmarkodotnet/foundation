using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.Workflow;

[Collection("WebApi")]
public class WorkflowEndpointTests
{
    private readonly WebApiFixture _fx;

    public WorkflowEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-020: Record Submission Data ──────────────────────────────────────

    [SkippableFact]
    public async Task UpdateSubmission_ValidData_Returns200WithSubmissionStep()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            submittedAt = "2025-03-15T10:00:00Z",
            submissionMethodId = (Guid?)null,
            externalIdentifier = "EXT-2027-001",
            notes = "Integráción teszt beadás"
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/submission", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("stepType").GetString().Should().Be("Submission");
        json.GetProperty("externalIdentifier").GetString().Should().Be("EXT-2027-001");
        json.GetProperty("notes").GetString().Should().Be("Integráción teszt beadás");
        json.GetProperty("submittedAt").GetDateTimeOffset().Should()
            .BeCloseTo(DateTimeOffset.Parse("2025-03-15T10:00:00Z"), TimeSpan.FromSeconds(1));
    }

    [SkippableFact]
    public async Task UpdateSubmission_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new
        {
            applicationId = Guid.NewGuid(),
            submittedAt = "2025-03-15T10:00:00Z",
            submissionMethodId = (Guid?)null,
            externalIdentifier = (string?)null,
            notes = (string?)null
        };

        using var req = new HttpRequestMessage(HttpMethod.Put,
            $"/api/v1/applications/{Guid.NewGuid()}/workflow/submission")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task UpdateSubmission_WithMegtekintoRole_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        var body = new
        {
            applicationId = app.Id,
            submittedAt = "2025-03-15T10:00:00Z",
            submissionMethodId = (Guid?)null,
            externalIdentifier = (string?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/submission", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task UpdateSubmission_StepNotActive_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedSubmittedApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            submittedAt = "2025-03-15T10:00:00Z",
            submissionMethodId = (Guid?)null,
            externalIdentifier = (string?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/submission", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task UpdateSubmission_NonExistentApplication_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var nonExistentId = Guid.NewGuid();

        var body = new
        {
            applicationId = nonExistentId,
            submittedAt = "2025-03-15T10:00:00Z",
            submissionMethodId = (Guid?)null,
            externalIdentifier = (string?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{nonExistentId}/workflow/submission", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── US-021: Approve / Reject Submission Step ─────────────────────────────

    [SkippableFact]
    public async Task ApproveSubmission_AsElnok_Returns200WithCompletedStep()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Elnok);

        var body = new { isApproved = true, rejectionNote = (string?)null };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/workflow/Submission/approve", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("stepType").GetString().Should().Be("Submission");
        json.GetProperty("status").GetString().Should().Be("Completed");
        json.GetProperty("approvedByUserId").GetGuid().Should().Be(userId);
    }

    [SkippableFact]
    public async Task RejectSubmission_WithNote_Returns200WithRejectionNote()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new { isApproved = false, rejectionNote = "Hiányos dokumentáció." };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/workflow/Submission/approve", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("stepType").GetString().Should().Be("Submission");
        json.GetProperty("status").GetString().Should().Be("Active");
        json.GetProperty("rejectionNote").GetString().Should().Be("Hiányos dokumentáció.");
    }

    [SkippableFact]
    public async Task ApproveSubmission_AsPalyazatiMunkatars_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new { isApproved = true, rejectionNote = (string?)null };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/workflow/Submission/approve", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── US-030: Record Won Result ────────────────────────────────────────────

    [SkippableFact]
    public async Task RecordResult_Won_Returns200WithWonStatus()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedSubmittedApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            isWon = true,
            awardedAmount = 1_500_000m,
            resultDate = "2025-08-01",
            resultIdentifier = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/result", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("Won");
    }

    [SkippableFact]
    public async Task RecordResult_Won_LaterStepsActivated()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedSubmittedApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            isWon = true,
            awardedAmount = 2_000_000m,
            resultDate = "2025-09-01",
            resultIdentifier = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/result", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var steps = json.GetProperty("workflowSteps").EnumerateArray().ToList();
        steps.Should().Contain(s =>
            s.GetProperty("stepType").GetString() == "Contract" &&
            s.GetProperty("status").GetString() == "Active");
        steps.Should().Contain(s =>
            s.GetProperty("stepType").GetString() == "Settlement" &&
            s.GetProperty("status").GetString() == "Active");
    }

    // ─── US-031: Record Lost Result + Close ───────────────────────────────────

    [SkippableFact]
    public async Task RecordResult_Lost_Returns200WithLostStatus()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedSubmittedApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            isWon = false,
            awardedAmount = (decimal?)null,
            resultDate = "2025-08-01",
            resultIdentifier = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/result", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("Lost");
        var steps = json.GetProperty("workflowSteps").EnumerateArray().ToList();
        steps.Should().Contain(s =>
            s.GetProperty("stepType").GetString() == "Contract" &&
            s.GetProperty("status").GetString() == "NotApplicable");
    }

    [SkippableFact]
    public async Task CloseLost_AsAdmin_Returns200WithClosedLostStatus()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedLostApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/close-lost", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("ClosedLost");
    }

    [SkippableFact]
    public async Task CloseLost_AsPalyazatiMunkatars_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedLostApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/close-lost", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── US-032: Correct Recorded Result (Admin) ──────────────────────────────

    [SkippableFact]
    public async Task CorrectResult_WonToLost_Returns200WithLostStatus()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            isWon = false,
            awardedAmount = (decimal?)null,
            resultDate = "2025-08-15",
            resultIdentifier = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/result/correct", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("Lost");
        var steps = json.GetProperty("workflowSteps").EnumerateArray().ToList();
        steps.Should().Contain(s =>
            s.GetProperty("stepType").GetString() == "Contract" &&
            s.GetProperty("status").GetString() == "NotApplicable");
    }

    [SkippableFact]
    public async Task CorrectResult_NonAdmin_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedLostApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            isWon = true,
            awardedAmount = 1_000_000m,
            resultDate = "2025-08-15",
            resultIdentifier = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/result/correct", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── US-040: Record Contract / Notification Data ─────────────────────────

    [SkippableFact]
    public async Task UpdateContractStep_Valid_Returns200WithContractData()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            contractIdentifier = "SZERZ-2025-001",
            contractDate = "2025-09-01",
            notificationReceived = true,
            notificationDate = "2025-08-20",
            complete = false
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/contract-granter", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("stepType").GetString().Should().Be("Contract");
        json.GetProperty("contractIdentifier").GetString().Should().Be("SZERZ-2025-001");
        json.GetProperty("notificationReceived").GetBoolean().Should().BeTrue();
        json.GetProperty("status").GetString().Should().Be("Active");
    }

    [SkippableFact]
    public async Task UpdateContractStep_StepNotActive_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        // Draft app: Contract step is Pending (not Active)
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            contractIdentifier = (string?)null,
            contractDate = (string?)null,
            notificationReceived = false,
            notificationDate = (string?)null,
            complete = false
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/workflow/contract-granter", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task UpdateContractStep_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new
        {
            contractIdentifier = (string?)null,
            contractDate = (string?)null,
            notificationReceived = false,
            notificationDate = (string?)null,
            complete = false
        };

        using var req = new HttpRequestMessage(HttpMethod.Put,
            $"/api/v1/applications/{Guid.NewGuid()}/workflow/contract-granter")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── Seed helpers ─────────────────────────────────────────────────────────

    private async Task<Domain.Entities.Application> SeedDraftApplicationAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Beadandó pályázat",
            granter.Id,
            new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(90) },
            userId);
        ctx.Applications.Add(app);

        await ctx.SaveChangesAsync();
        return app;
    }

    // Status=Submitted, Submission step Completed, Result step Active
    private async Task<Domain.Entities.Application> SeedSubmittedApplicationAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Beadott pályázat",
            granter.Id,
            new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(90) },
            userId);

        app.RecordSubmission(
            new SubmissionStepData { SubmittedAt = DateTimeOffset.UtcNow.AddDays(-2), SubmittedByUserId = userId },
            userId);
        app.ApproveSubmission(userId);

        ctx.Applications.Add(app);
        await ctx.SaveChangesAsync();
        return app;
    }

    // Status=Won, steps 4-9 Active
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
            ApplicationResult.Won(
                DateOnly.FromDateTime(DateTime.Today.AddDays(-5)),
                new Money(1_500_000m, "HUF")),
            userId);

        ctx.Applications.Add(app);
        await ctx.SaveChangesAsync();
        return app;
    }

    // Status=Lost, steps 4-9 NotApplicable
    private async Task<Domain.Entities.Application> SeedLostApplicationAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Vesztes pályázat",
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

        ctx.Applications.Add(app);
        await ctx.SaveChangesAsync();
        return app;
    }
}
