using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.EmailRecords;

[Collection("WebApi")]
public class EmailRecordEndpointTests
{
    private readonly WebApiFixture _fx;

    public EmailRecordEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-090: Record Email Manually ────────────────────────────────────────

    [SkippableFact]
    public async Task CreateEmailRecord_ValidPayload_Returns201()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            workflowStepId = (Guid?)null,
            subject = "Pályázat eredményéről értesítés",
            senderEmail = "palyaztato@example.hu",
            sentDate = "2025-08-05",
            direction = "In",
            contentSummary = "Nyert pályázatról tájékoztatás."
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/emails", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("applicationId").GetGuid().Should().Be(app.Id);
        json.GetProperty("subject").GetString().Should().Be("Pályázat eredményéről értesítés");
        json.GetProperty("senderEmail").GetString().Should().Be("palyaztato@example.hu");
        json.GetProperty("direction").GetString().Should().Be("In");
        json.GetProperty("hasAttachment").GetBoolean().Should().BeFalse();
    }

    [SkippableFact]
    public async Task CreateEmailRecord_InvalidEmailFormat_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var body = new
        {
            applicationId = app.Id,
            workflowStepId = (Guid?)null,
            subject = "Tárgy",
            senderEmail = "not-a-valid-email",
            sentDate = "2025-08-05",
            direction = "Out",
            contentSummary = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/emails", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task CreateEmailRecord_MissingSubject_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var body = new
        {
            applicationId = app.Id,
            workflowStepId = (Guid?)null,
            subject = "",
            senderEmail = "feladó@example.com",
            sentDate = "2025-08-05",
            direction = "In",
            contentSummary = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{app.Id}/emails", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task CreateEmailRecord_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new
        {
            subject = "Tárgy",
            senderEmail = "feladó@example.com",
            sentDate = "2025-08-05",
            direction = "In",
            contentSummary = (string?)null
        };

        using var req = new HttpRequestMessage(
            HttpMethod.Post, $"/api/v1/applications/{Guid.NewGuid()}/emails")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task GetEmailRecords_AfterCreate_ReturnsListOrderedByDateDesc()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Create two emails on different dates
        await CreateEmailAsync(app.Id, "Régebbi e-mail", "feladó@example.com", "2025-07-01", "In", token);
        await CreateEmailAsync(app.Id, "Újabb e-mail", "feladó@example.com", "2025-08-15", "Out", token);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/emails", token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await response.Content.ReadFromJsonAsync<JsonElement>())
            .EnumerateArray().ToList();
        items.Should().HaveCountGreaterThanOrEqualTo(2);
        // Newest first — 2025-08-15 before 2025-07-01
        var dates = items.Select(i => i.GetProperty("sentDate").GetString()).ToList();
        dates.Should().ContainInOrder("2025-08-15", "2025-07-01");
    }

    // ─── US-091: Email File Upload and Preview ────────────────────────────────

    [SkippableFact]
    public async Task AttachEmailFile_ValidEml_Returns200WithHasAttachmentTrue()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var emailId = await CreateEmailAsync(
            app.Id, "E-mail csatolmánnyal", "feladó@example.com", "2025-09-01", "In", token);

        using var form = BuildEmlForm("email.eml", MinimalEmlBytes(), "message/rfc822");
        using var req = BuildFileRequest(
            HttpMethod.Post,
            $"/api/v1/applications/{app.Id}/emails/{emailId}/attachment",
            form, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("hasAttachment").GetBoolean().Should().BeTrue();
        json.GetProperty("attachmentFileName").GetString().Should().Be("email.eml");
    }

    [SkippableFact]
    public async Task AttachEmailFile_InvalidFileType_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        var emailId = await CreateEmailAsync(
            app.Id, "E-mail", "feladó@example.com", "2025-09-05", "Out", token);

        // PDF is not allowed for email attachment (only .eml or .msg)
        using var form = BuildEmlForm("document.pdf", "%PDF-1.4"u8.ToArray(), "application/pdf");
        using var req = BuildFileRequest(
            HttpMethod.Post,
            $"/api/v1/applications/{app.Id}/emails/{emailId}/attachment",
            form, token);
        var response = await _fx.Client.SendAsync(req);

        // DomainException → 400
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task GetEmailPreview_AfterEmlAttach_Returns200WithParsedFields()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var emailId = await CreateEmailAsync(
            app.Id, "Preview teszt", "feladó@example.com", "2025-09-10", "In", token);

        using var attachForm = BuildEmlForm("preview.eml", MinimalEmlBytes(), "message/rfc822");
        using var attachReq = BuildFileRequest(
            HttpMethod.Post,
            $"/api/v1/applications/{app.Id}/emails/{emailId}/attachment",
            attachForm, token);
        (await _fx.Client.SendAsync(attachReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        using var previewReq = WebApiFixture.BuildRequest(
            HttpMethod.Get,
            $"/api/v1/applications/{app.Id}/emails/{emailId}/preview",
            token: token);
        var previewResp = await _fx.Client.SendAsync(previewReq);

        previewResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await previewResp.Content.ReadFromJsonAsync<JsonElement>();
        // EML headers are present in the parsed preview
        json.GetProperty("subject").GetString().Should().Be("Teszt e-mail tárgy");
        json.GetProperty("from").GetString().Should().Contain("feladó@example.com");
    }

    [SkippableFact]
    public async Task DownloadEmailAttachment_AfterAttach_Returns200WithFileStream()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);
        var writerToken = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var emailId = await CreateEmailAsync(
            app.Id, "Letölthető e-mail", "feladó@example.com", "2025-09-15", "In", writerToken);

        using var attachForm = BuildEmlForm("download.eml", MinimalEmlBytes(), "message/rfc822");
        using var attachReq = BuildFileRequest(
            HttpMethod.Post,
            $"/api/v1/applications/{app.Id}/emails/{emailId}/attachment",
            attachForm, writerToken);
        (await _fx.Client.SendAsync(attachReq)).StatusCode.Should().Be(HttpStatusCode.OK);

        using var downloadReq = WebApiFixture.BuildRequest(
            HttpMethod.Get,
            $"/api/v1/applications/{app.Id}/emails/{emailId}/download",
            token: token);
        var downloadResp = await _fx.Client.SendAsync(downloadReq);

        downloadResp.StatusCode.Should().Be(HttpStatusCode.OK);
        (await downloadResp.Content.ReadAsByteArrayAsync()).Should().NotBeEmpty();
    }

    [SkippableFact]
    public async Task GetEmailPreview_WithoutAttachment_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);
        var writerToken = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var emailId = await CreateEmailAsync(
            app.Id, "Csatolmány nélkül", "feladó@example.com", "2025-09-20", "In", writerToken);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get,
            $"/api/v1/applications/{app.Id}/emails/{emailId}/preview",
            token: token);
        var response = await _fx.Client.SendAsync(req);

        // No attachment stored → handler throws NotFoundException → 404
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── US-092: Delete Email Record ──────────────────────────────────────────

    [SkippableFact]
    public async Task DeleteEmailRecord_ByCreator_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        var emailId = await CreateEmailAsync(
            app.Id, "Törölhető e-mail", "feladó@example.com", "2025-10-01", "In", token);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete,
            $"/api/v1/applications/{app.Id}/emails/{emailId}",
            token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task DeleteEmailRecord_ByOtherNonAdminUser_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(userA);
        var tokenA = _fx.GenerateJwt(userA, UserRole.PalyazatiMunkatars);
        var tokenB = _fx.GenerateJwt(userB, UserRole.PalyazatiMunkatars);

        // User A creates the email record
        var emailId = await CreateEmailAsync(
            app.Id, "A-féle e-mail", "feladó@example.com", "2025-10-05", "Out", tokenA);

        // User B (not owner, not Admin) tries to delete → 403
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete,
            $"/api/v1/applications/{app.Id}/emails/{emailId}",
            token: tokenB);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task DeleteEmailRecord_ByAdmin_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var ownerUserId = Guid.NewGuid();
        var adminUserId = Guid.NewGuid();
        var app = await SeedDraftApplicationAsync(ownerUserId);
        var ownerToken = _fx.GenerateJwt(ownerUserId, UserRole.PalyazatiMunkatars);
        var adminToken = _fx.GenerateJwt(adminUserId, UserRole.Admin);

        var emailId = await CreateEmailAsync(
            app.Id, "Admin törölhető", "feladó@example.com", "2025-10-10", "In", ownerToken);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Delete,
            $"/api/v1/applications/{app.Id}/emails/{emailId}",
            token: adminToken);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<Guid> CreateEmailAsync(
        Guid applicationId, string subject, string senderEmail,
        string sentDate, string direction, string token)
    {
        var body = new
        {
            applicationId,
            workflowStepId = (Guid?)null,
            subject,
            senderEmail,
            sentDate,
            direction,
            contentSummary = (string?)null
        };
        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Post, $"/api/v1/applications/{applicationId}/emails", body, token);
        var resp = await _fx.Client.SendAsync(req);
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("id").GetGuid();
    }

    private static MultipartFormDataContent BuildEmlForm(
        string fileName, byte[] content, string contentType)
    {
        var form = new MultipartFormDataContent();
        var filePart = new ByteArrayContent(content);
        filePart.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        form.Add(filePart, "file", fileName);
        return form;
    }

    private static HttpRequestMessage BuildFileRequest(
        HttpMethod method, string url, MultipartFormDataContent content, string token)
    {
        var req = new HttpRequestMessage(method, url) { Content = content };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return req;
    }

    // Minimal valid EML that MimeKit can parse
    private static byte[] MinimalEmlBytes() =>
        "MIME-Version: 1.0\r\nDate: Mon, 01 Jan 2024 12:00:00 +0000\r\nFrom: feladó@example.com\r\nTo: cimzett@example.com\r\nSubject: Teszt e-mail tárgy\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nTeszt e-mail tartalom."u8.ToArray();

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
