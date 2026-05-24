using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;
using Invoice = GrantManagement.Domain.Entities.Invoice;

namespace GrantManagement.Integration.Tests.VendorContracts;

[Collection("WebApi")]
public class VendorContractEndpointTests
{
    private readonly WebApiFixture _fx;

    public VendorContractEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-055: Record New Vendor Contract ───────────────────────────────────

    [SkippableFact]
    public async Task CreateVendorContract_ValidPayload_Returns201()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var vendorId = await SeedVendorAsync();
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            vendorId,
            amount = 250_000m,
            currency = "HUF",
            contractDate = "2025-10-01",
            contractIdentifier = "ALVSZ-2025-001",
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/vendor-contracts", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("applicationId").GetGuid().Should().Be(app.Id);
        json.GetProperty("vendorId").GetGuid().Should().Be(vendorId);
        json.GetProperty("amount").GetDecimal().Should().Be(250_000m);
        json.GetProperty("contractIdentifier").GetString().Should().Be("ALVSZ-2025-001");
    }

    [SkippableFact]
    public async Task CreateVendorContract_ApplicationNotWon_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var vendorId = await SeedVendorAsync();
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            vendorId,
            amount = 100_000m,
            currency = "HUF",
            contractDate = "2025-10-01",
            contractIdentifier = (string?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/vendor-contracts", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task GetVendorContracts_AfterCreate_ReturnsListWithContract()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var vendorId = await SeedVendorAsync();
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // Create a contract
        var createBody = new
        {
            applicationId = app.Id,
            vendorId,
            amount = 180_000m,
            currency = "HUF",
            contractDate = "2025-11-01",
            contractIdentifier = "ALVSZ-LIST-001",
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };
        using var createReq = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/vendor-contracts", createBody, token);
        (await _fx.Client.SendAsync(createReq)).StatusCode.Should().Be(HttpStatusCode.Created);

        // GET the list
        using var listReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/vendor-contracts", token: token);
        var listResponse = await _fx.Client.SendAsync(listReq);

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.EnumerateArray().ToList();
        items.Should().ContainSingle(c =>
            c.GetProperty("contractIdentifier").GetString() == "ALVSZ-LIST-001" &&
            c.GetProperty("amount").GetDecimal() == 180_000m);
    }

    [SkippableFact]
    public async Task CreateVendorContract_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new
        {
            vendorId = Guid.NewGuid(),
            amount = 100_000m,
            currency = "HUF",
            contractDate = "2025-10-01",
            contractIdentifier = (string?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };

        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"/api/v1/applications/{Guid.NewGuid()}/vendor-contracts")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task DeleteVendorContract_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var vendorId = await SeedVendorAsync();
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // Create a contract to delete
        var createBody = new
        {
            applicationId = app.Id,
            vendorId,
            amount = 75_000m,
            currency = "HUF",
            contractDate = "2025-12-01",
            contractIdentifier = (string?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };
        using var createReq = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/vendor-contracts", createBody, token);
        var createResp = await _fx.Client.SendAsync(createReq);
        createResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var contractJson = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var contractId = contractJson.GetProperty("id").GetGuid();

        // Delete the contract
        using var deleteReq = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}/vendor-contracts/{contractId}", token: token);
        var deleteResp = await _fx.Client.SendAsync(deleteReq);

        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ─── US-056: Delete Vendor Contract with Linked Invoice ───────────────────

    [SkippableFact]
    public async Task DeleteVendorContract_WithLinkedInvoice_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var vendorId = await SeedVendorAsync();
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // Create a vendor contract via HTTP
        var createBody = new
        {
            applicationId = app.Id,
            vendorId,
            amount = 100_000m,
            currency = "HUF",
            contractDate = "2025-10-01",
            contractIdentifier = "LINKED-001",
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };
        using var createReq = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/vendor-contracts", createBody, token);
        var createResp = await _fx.Client.SendAsync(createReq);
        createResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var contractJson = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var contractId = contractJson.GetProperty("id").GetGuid();

        // Seed an invoice linked to this contract directly in the DB
        await using var ctx = _fx.CreateDbContext();
        var invoice = Invoice.Create(
            app.Id, "Teszt Szállító", "SZ-2025-001",
            DateOnly.FromDateTime(DateTime.Today), 50_000m,
            isPaid: false, paymentDate: null, createdByUserId: userId,
            vendorContractId: contractId);
        ctx.Invoices.Add(invoice);
        await ctx.SaveChangesAsync();

        // Attempt to delete the linked contract → DomainException → 400
        using var deleteReq = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}/vendor-contracts/{contractId}",
            token: token);
        var deleteResp = await _fx.Client.SendAsync(deleteReq);

        deleteResp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ─── Seed helpers ─────────────────────────────────────────────────────────

    private async Task<Guid> SeedVendorAsync()
    {
        await using var ctx = _fx.CreateDbContext();
        var vendor = Vendor.Create($"Teszt Kft-{Guid.NewGuid():N}", null, null, ContactInfo.Empty);
        ctx.Vendors.Add(vendor);
        await ctx.SaveChangesAsync();
        return vendor.Id;
    }

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
