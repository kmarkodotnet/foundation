using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.Settlement;

[Collection("WebApi")]
public class SettlementEndpointTests
{
    private readonly WebApiFixture _fx;

    public SettlementEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-070: Record Settlement ────────────────────────────────────────────

    [SkippableFact]
    public async Task RecordSettlement_ValidPayload_Returns200WithSettlementDto()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Penzugyes);

        var body = new
        {
            applicationId = app.Id,
            settlementDate = "2025-12-15",
            settlementMethodId = (Guid?)null,
            description = "Pénzügyi és tartalmi elszámolás benyújtva.",
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/settlement", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("applicationId").GetGuid().Should().Be(app.Id);
        json.GetProperty("settlementDate").GetString().Should().Be("2025-12-15");
        json.GetProperty("description").GetString().Should().Be("Pénzügyi és tartalmi elszámolás benyújtva.");
        json.GetProperty("hasLowCoverageWarning").GetBoolean().Should().BeTrue(); // no invoices → 0 coverage
    }

    [SkippableFact]
    public async Task RecordSettlement_AsPalyazatiMunkatars_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            settlementDate = "2025-12-15",
            settlementMethodId = (Guid?)null,
            description = (string?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/settlement", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task GetSettlement_BeforeRecord_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/settlement", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task GetSettlement_AfterRecord_Returns200WithCoveragePercent()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Penzugyes);

        // Seed an invoice to get non-zero coverage
        await using (var ctx = _fx.CreateDbContext())
        {
            var invoice = Invoice.Create(
                app.Id, "Szállító", "SZ-SETTLE-001",
                DateOnly.FromDateTime(DateTime.Today.AddDays(-3)), 1_200_000m,
                isPaid: true, paymentDate: DateOnly.FromDateTime(DateTime.Today.AddDays(-3)),
                createdByUserId: userId);
            ctx.Invoices.Add(invoice);
            await ctx.SaveChangesAsync();
        }

        // Record settlement
        var putBody = new
        {
            applicationId = app.Id,
            settlementDate = "2025-12-20",
            settlementMethodId = (Guid?)null,
            description = (string?)null,
            notes = (string?)null
        };
        using var putReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/settlement", putBody, token);
        (await _fx.Client.SendAsync(putReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        // GET the settlement
        using var getReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/settlement", token: token);
        var getResponse = await _fx.Client.SendAsync(getReq);

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("settlementDate").GetString().Should().Be("2025-12-20");
        // 1 200 000 / 1 500 000 = 80% → no low-coverage warning
        json.GetProperty("invoiceCoveragePercent").GetDecimal().Should().Be(80m);
        json.GetProperty("hasLowCoverageWarning").GetBoolean().Should().BeFalse();
    }

    // ─── US-071: Approve Settlement + Close Application ───────────────────────

    [SkippableFact]
    public async Task ApproveSettlement_AsElnok_Returns200WithClosedWonStatus()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var penzugyesToken = _fx.GenerateJwt(userId, UserRole.Penzugyes);
        var elnokToken = _fx.GenerateJwt(userId, UserRole.Elnok);

        // Record settlement first
        var putBody = new
        {
            applicationId = app.Id,
            settlementDate = "2025-12-15",
            settlementMethodId = (Guid?)null,
            description = "Végleges elszámolás.",
            notes = (string?)null
        };
        using var putReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/settlement", putBody, penzugyesToken);
        (await _fx.Client.SendAsync(putReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        // Approve settlement as Elnök
        var approveBody = new { isApproved = true, rejectionNote = (string?)null };
        using var approveReq = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/settlement/approve",
            approveBody, elnokToken);
        var approveResp = await _fx.Client.SendAsync(approveReq);

        approveResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await approveResp.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("status").GetString().Should().Be("ClosedWon");

        // All workflow steps must be Locked
        var steps = json.GetProperty("workflowSteps").EnumerateArray().ToList();
        steps.Should().AllSatisfy(s =>
            s.GetProperty("status").GetString().Should().Be("Locked"));
    }

    [SkippableFact]
    public async Task ApproveSettlement_AsPalyazatiMunkatars_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new { isApproved = true, rejectionNote = (string?)null };
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/settlement/approve", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task RejectSettlement_AsElnok_Returns200WithActiveSettlementStep()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var penzugyesToken = _fx.GenerateJwt(userId, UserRole.Penzugyes);
        var elnokToken = _fx.GenerateJwt(userId, UserRole.Elnok);

        // Record settlement
        var putBody = new
        {
            applicationId = app.Id,
            settlementDate = "2025-12-15",
            settlementMethodId = (Guid?)null,
            description = (string?)null,
            notes = (string?)null
        };
        using var putReq = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/applications/{app.Id}/settlement", putBody, penzugyesToken);
        (await _fx.Client.SendAsync(putReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        // Reject settlement as Elnök
        var rejectBody = new { isApproved = false, rejectionNote = "Hiányos dokumentáció." };
        using var rejectReq = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/settlement/approve",
            rejectBody, elnokToken);
        var rejectResp = await _fx.Client.SendAsync(rejectReq);

        rejectResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await rejectResp.Content.ReadFromJsonAsync<JsonElement>();
        // Application stays Won after rejection
        json.GetProperty("status").GetString().Should().Be("Won");

        var settlementStep = json.GetProperty("workflowSteps")
            .EnumerateArray()
            .First(s => s.GetProperty("stepType").GetString() == "Settlement");
        settlementStep.GetProperty("rejectionNote").GetString().Should().Be("Hiányos dokumentáció.");
    }

    // ─── Seed helpers ─────────────────────────────────────────────────────────

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
