using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.Invoices;

[Collection("WebApi")]
public class InvoiceEndpointTests
{
    private readonly WebApiFixture _fx;

    public InvoiceEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-060: Record New Invoice ───────────────────────────────────────────

    [SkippableFact]
    public async Task CreateInvoice_ValidPayload_Returns201()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Penzugyes);

        var body = new
        {
            applicationId = app.Id,
            supplierName = "Teszt Kft",
            invoiceNumber = "TESZT-2025-001",
            issueDate = "2025-10-15",
            amount = 250_000m,
            isPaid = false,
            paymentDate = (string?)null,
            vendorContractId = (Guid?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/invoices", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("applicationId").GetGuid().Should().Be(app.Id);
        json.GetProperty("supplierName").GetString().Should().Be("Teszt Kft");
        json.GetProperty("invoiceNumber").GetString().Should().Be("TESZT-2025-001");
        json.GetProperty("amount").GetDecimal().Should().Be(250_000m);
        json.GetProperty("isPaid").GetBoolean().Should().BeFalse();
    }

    [SkippableFact]
    public async Task CreateInvoice_ApplicationNotWon_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            supplierName = "Teszt Kft",
            invoiceNumber = "SZ-001",
            issueDate = "2025-10-01",
            amount = 100_000m,
            isPaid = false,
            paymentDate = (string?)null,
            vendorContractId = (Guid?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/invoices", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task CreateInvoice_IsPaidWithoutPaymentDate_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Penzugyes);

        var body = new
        {
            applicationId = app.Id,
            supplierName = "Teszt Kft",
            invoiceNumber = "SZ-PAID-001",
            issueDate = "2025-10-01",
            amount = 100_000m,
            isPaid = true,
            paymentDate = (string?)null,  // missing — required when isPaid
            vendorContractId = (Guid?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/invoices", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task CreateInvoice_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new
        {
            supplierName = "Teszt Kft",
            invoiceNumber = "SZ-001",
            issueDate = "2025-10-01",
            amount = 100_000m,
            isPaid = false,
            paymentDate = (string?)null,
            vendorContractId = (Guid?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };

        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"/api/v1/applications/{Guid.NewGuid()}/invoices")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task GetInvoices_AfterCreate_Returns200WithSummary()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // Create two invoices
        await CreateInvoiceAsync(app.Id, "Szállító A", "SZ-A-001", 300_000m, isPaid: false, token: token);
        await CreateInvoiceAsync(app.Id, "Szállító B", "SZ-B-001", 200_000m, isPaid: true,
            paymentDate: "2025-10-20", token: token);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/invoices", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("items").GetArrayLength().Should().Be(2);
        json.GetProperty("summary").GetProperty("totalInvoiced").GetDecimal().Should().Be(500_000m);
        json.GetProperty("summary").GetProperty("totalPaid").GetDecimal().Should().Be(200_000m);
        json.GetProperty("summary").GetProperty("totalUnpaid").GetDecimal().Should().Be(300_000m);
    }

    // ─── US-061: Mark Invoice Paid / Update Invoice ───────────────────────────

    [SkippableFact]
    public async Task MarkInvoicePaid_ValidPaymentDate_Returns200WithIsPaidTrue()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Penzugyes);

        // Create an unpaid invoice
        var invoiceId = await CreateInvoiceAsync(app.Id, "Szállító", "SZ-MARK-001", 150_000m,
            isPaid: false, token: token);

        var body = new
        {
            applicationId = app.Id,
            invoiceId,
            paymentDate = "2025-11-05"
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Patch, $"/api/v1/applications/{app.Id}/invoices/{invoiceId}/mark-paid",
            body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("isPaid").GetBoolean().Should().BeTrue();
        json.GetProperty("paymentDate").GetString().Should().Be("2025-11-05");
    }

    [SkippableFact]
    public async Task MarkInvoicePaid_AlreadyPaid_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        // Create an already-paid invoice
        var invoiceId = await CreateInvoiceAsync(app.Id, "Szállító", "SZ-ALREADY-001", 100_000m,
            isPaid: true, paymentDate: "2025-10-01", token: token);

        var body = new
        {
            applicationId = app.Id,
            invoiceId,
            paymentDate = "2025-11-01"
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Patch, $"/api/v1/applications/{app.Id}/invoices/{invoiceId}/mark-paid",
            body, token);
        var response = await _fx.Client.SendAsync(req);

        // Already paid → DomainException → 400
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ─── US-062: Delete Invoice ───────────────────────────────────────────────

    [SkippableFact]
    public async Task DeleteInvoice_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var invoiceId = await CreateInvoiceAsync(app.Id, "Szállító", "SZ-DEL-001", 80_000m,
            isPaid: false, token: token);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}/invoices/{invoiceId}",
            token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task DeleteInvoice_LockedApplication_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var (app, invoiceId) = await SeedClosedLostApplicationWithInvoiceAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Penzugyes);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete, $"/api/v1/applications/{app.Id}/invoices/{invoiceId}",
            token: token);
        var response = await _fx.Client.SendAsync(req);

        // Locked application → AuthorizationBehaviour → ForbiddenException → 403
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── US-063: Invoice Filtering and Summary ────────────────────────────────

    [SkippableFact]
    public async Task GetInvoices_FilterByIsPaid_ReturnsOnlyMatchingItems()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        await CreateInvoiceAsync(app.Id, "Fizetve Szállító", "SZ-F-001", 100_000m,
            isPaid: true, paymentDate: "2025-10-01", token: token);
        await CreateInvoiceAsync(app.Id, "Nem Fizetve Szállító", "SZ-NF-001", 200_000m,
            isPaid: false, token: token);

        // Filter: only unpaid
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/invoices?isPaid=false",
            token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.GetProperty("items").EnumerateArray().ToList();
        items.Should().AllSatisfy(i => i.GetProperty("isPaid").GetBoolean().Should().BeFalse());
        items.Should().ContainSingle(i =>
            i.GetProperty("invoiceNumber").GetString() == "SZ-NF-001");
    }

    [SkippableFact]
    public async Task GetInvoices_Summary_AwardedAmountMatchesApplication()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/invoices", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        // Won application has awardedAmount = 1 500 000 HUF from seed
        json.GetProperty("summary").GetProperty("awardedAmount").GetDecimal().Should().Be(1_500_000m);
        json.GetProperty("summary").GetProperty("totalInvoiced").GetDecimal().Should().Be(0m);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<Guid> CreateInvoiceAsync(
        Guid applicationId, string supplierName, string invoiceNumber,
        decimal amount, bool isPaid, string? paymentDate = null, string? token = null)
    {
        var body = new
        {
            applicationId,
            supplierName,
            invoiceNumber,
            issueDate = "2025-10-01",
            amount,
            isPaid,
            paymentDate,
            vendorContractId = (Guid?)null,
            budgetItemId = (Guid?)null,
            notes = (string?)null
        };
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{applicationId}/invoices", body, token);
        var resp = await _fx.Client.SendAsync(req);
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("id").GetGuid();
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

    private async Task<(Domain.Entities.Application app, Guid invoiceId)> SeedClosedLostApplicationWithInvoiceAsync(Guid userId)
    {
        await using var ctx = _fx.CreateDbContext();

        var granter = Granter.Create($"Pályáztató-{Guid.NewGuid():N}", null, ContactInfo.Empty);
        ctx.Granters.Add(granter);

        var app = Domain.Entities.Application.Create(
            "Lezárt pályázat",
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

        // Seed invoice before the app state is persisted (it is ClosedLost at DB level)
        var invoice = Invoice.Create(
            app.Id, "Szállító", "SZ-LOCK-001",
            DateOnly.FromDateTime(DateTime.Today.AddDays(-6)), 50_000m,
            isPaid: false, paymentDate: null, createdByUserId: userId);

        ctx.Applications.Add(app);
        ctx.Invoices.Add(invoice);
        await ctx.SaveChangesAsync();

        return (app, invoice.Id);
    }
}
