using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.Documents;

[Collection("WebApi")]
public class DocumentEndpointTests
{
    private readonly WebApiFixture _fx;

    public DocumentEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-080: Upload Document to Workflow Step ─────────────────────────────

    [SkippableFact]
    public async Task UploadDocument_ValidPdf_Returns201WithDocumentDto()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        using var form = BuildDocumentForm(
            documentType: "CallDocument",
            fileName: "palyazat.pdf",
            contentType: "application/pdf",
            displayName: "Kiírás dokumentuma");

        using var req = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("documentType").GetString().Should().Be("CallDocument");
        json.GetProperty("displayName").GetString().Should().Be("Kiírás dokumentuma");
        json.GetProperty("fileName").GetString().Should().Be("palyazat.pdf");
        json.GetProperty("contentType").GetString().Should().Be("application/pdf");
        json.GetProperty("version").GetInt32().Should().Be(1);
        json.GetProperty("isArchived").GetBoolean().Should().BeFalse();
    }

    [SkippableFact]
    public async Task UploadDocument_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var form = BuildDocumentForm("Other", "doc.pdf", "application/pdf");
        using var req = BuildMultipartRequest(
            $"/api/v1/applications/{Guid.NewGuid()}/documents", form, token: null);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task UploadDocument_AsMegtekinto_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        using var form = BuildDocumentForm("Other", "doc.pdf", "application/pdf");
        using var req = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task GetDocuments_AfterUpload_ReturnsListWithDocument()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Upload a document
        using var form = BuildDocumentForm(
            "SubmissionDocument", "beadv.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Beadványcsomag");
        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form, token);
        (await _fx.Client.SendAsync(uploadReq)).StatusCode.Should().Be(HttpStatusCode.Created);

        // GET the list
        using var listReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/documents", token: token);
        var listResponse = await _fx.Client.SendAsync(listReq);

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.EnumerateArray().ToList();
        items.Should().ContainSingle(d =>
            d.GetProperty("documentType").GetString() == "SubmissionDocument" &&
            d.GetProperty("displayName").GetString() == "Beadványcsomag");
    }

    [SkippableFact]
    public async Task GetDocuments_FilteredByStepId_ReturnsOnlyStepDocuments()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Get the workflow step ID for the Call step
        using var appReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}", token: token);
        var appResp = await _fx.Client.SendAsync(appReq);
        var appJson = await appResp.Content.ReadFromJsonAsync<JsonElement>();
        var callStepId = appJson
            .GetProperty("workflowSteps")
            .EnumerateArray()
            .First(s => s.GetProperty("stepType").GetString() == "Call")
            .GetProperty("id").GetGuid();

        // Upload a document tied to the Call step
        using var form = BuildDocumentForm("CallDocument", "kiras.pdf", "application/pdf");
        var formContent = new MultipartFormDataContent();
        formContent.Add(new StringContent(callStepId.ToString()), "WorkflowStepId");
        formContent.Add(new StringContent("CallDocument"), "DocumentType");
        var filePart = new ByteArrayContent(FakePdfBytes());
        filePart.Headers.ContentType = MediaTypeHeaderValue.Parse("application/pdf");
        formContent.Add(filePart, "File", "kiras.pdf");

        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", formContent, token);
        (await _fx.Client.SendAsync(uploadReq)).StatusCode.Should().Be(HttpStatusCode.Created);

        // GET documents filtered by step
        using var listReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/documents?stepId={callStepId}",
            token: token);
        var listResponse = await _fx.Client.SendAsync(listReq);

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.EnumerateArray().ToList();
        items.Should().AllSatisfy(d =>
            d.GetProperty("documentType").GetString().Should().Be("CallDocument"));
    }

    // ─── US-081: Document Download and Preview ───────────────────────────────

    [SkippableFact]
    public async Task DownloadDocument_ValidDocument_Returns200WithCorrectContentType()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Upload a document first
        using var form = BuildDocumentForm("Other", "teszt.pdf", "application/pdf");
        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form, token);
        var uploadResp = await _fx.Client.SendAsync(uploadReq);
        uploadResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var uploadJson = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var docId = uploadJson.GetProperty("id").GetGuid();

        // Download the document
        using var downloadReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/documents/{docId}/download",
            token: token);
        var downloadResp = await _fx.Client.SendAsync(downloadReq);

        downloadResp.StatusCode.Should().Be(HttpStatusCode.OK);
        downloadResp.Content.Headers.ContentType?.MediaType.Should().Be("application/pdf");
    }

    [SkippableFact]
    public async Task DownloadDocument_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/v1/applications/{Guid.NewGuid()}/documents/{Guid.NewGuid()}/download");
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task DownloadDocument_NonExistentDocument_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Get,
            $"/api/v1/applications/{app.Id}/documents/{Guid.NewGuid()}/download",
            token: token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── US-082: Upload New Document Version ─────────────────────────────────

    [SkippableFact]
    public async Task UploadDocumentVersion_Returns201WithVersion2AndParentArchived()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Upload original document
        using var form1 = BuildDocumentForm("SubmissionDocument", "v1.pdf", "application/pdf", "Első verzió");
        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form1, token);
        var uploadResp = await _fx.Client.SendAsync(uploadReq);
        uploadResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var docId = (await uploadResp.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();

        // Upload new version
        var form2 = new MultipartFormDataContent();
        form2.Add(new StringContent("Második verzió"), "DisplayName");
        var filePart = new ByteArrayContent(FakePdfBytes());
        filePart.Headers.ContentType = MediaTypeHeaderValue.Parse("application/pdf");
        form2.Add(filePart, "File", "v2.pdf");

        using var versionReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents/{docId}/versions", form2, token);
        var versionResp = await _fx.Client.SendAsync(versionReq);

        versionResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var versionJson = await versionResp.Content.ReadFromJsonAsync<JsonElement>();
        versionJson.GetProperty("version").GetInt32().Should().Be(2);
        versionJson.GetProperty("isArchived").GetBoolean().Should().BeFalse();
        versionJson.GetProperty("displayName").GetString().Should().Be("Második verzió");
    }

    [SkippableFact]
    public async Task GetDocumentVersions_AfterNewVersion_ReturnsBothWithOriginalArchived()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Upload original
        using var form1 = BuildDocumentForm("Other", "v1.pdf", "application/pdf");
        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form1, token);
        var docId = (await (await _fx.Client.SendAsync(uploadReq))
            .Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();

        // Upload version 2
        var form2 = new MultipartFormDataContent();
        var filePart = new ByteArrayContent(FakePdfBytes());
        filePart.Headers.ContentType = MediaTypeHeaderValue.Parse("application/pdf");
        form2.Add(filePart, "File", "v2.pdf");
        using var versionReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents/{docId}/versions", form2, token);
        (await _fx.Client.SendAsync(versionReq)).StatusCode.Should().Be(HttpStatusCode.Created);

        // GET versions
        using var versionsReq = WebApiFixture.BuildRequest(
            HttpMethod.Get,
            $"/api/v1/applications/{app.Id}/documents/{docId}/versions",
            token: token);
        var versionsResp = await _fx.Client.SendAsync(versionsReq);

        versionsResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var versions = (await versionsResp.Content.ReadFromJsonAsync<JsonElement>())
            .EnumerateArray().ToList();
        versions.Should().HaveCount(2);
        versions.Should().ContainSingle(v => v.GetProperty("version").GetInt32() == 2
            && !v.GetProperty("isArchived").GetBoolean());
        versions.Should().ContainSingle(v => v.GetProperty("version").GetInt32() == 1
            && v.GetProperty("isArchived").GetBoolean());
    }

    // ─── US-083: Archive Document ─────────────────────────────────────────────

    [SkippableFact]
    public async Task ArchiveDocument_AsAdmin_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        using var form = BuildDocumentForm("Other", "archive-me.pdf", "application/pdf");
        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form, token);
        var docId = (await (await _fx.Client.SendAsync(uploadReq))
            .Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();

        using var archiveReq = WebApiFixture.BuildRequest(
            HttpMethod.Patch,
            $"/api/v1/applications/{app.Id}/documents/{docId}/archive",
            token: token);
        var archiveResp = await _fx.Client.SendAsync(archiveReq);

        archiveResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task ArchiveDocument_AsPalyazatiMunkatars_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var adminToken = _fx.GenerateJwt(userId, UserRole.Admin);
        var pmToken = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        using var form = BuildDocumentForm("Other", "doc.pdf", "application/pdf");
        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form, adminToken);
        var docId = (await (await _fx.Client.SendAsync(uploadReq))
            .Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();

        using var archiveReq = WebApiFixture.BuildRequest(
            HttpMethod.Patch,
            $"/api/v1/applications/{app.Id}/documents/{docId}/archive",
            token: pmToken);
        var response = await _fx.Client.SendAsync(archiveReq);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task ArchiveDocument_ExcludedFromDefaultListButIncludedWithFlag()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        using var form = BuildDocumentForm("Other", "to-archive.pdf", "application/pdf", "Archiválandó doc");
        using var uploadReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/documents", form, token);
        var docId = (await (await _fx.Client.SendAsync(uploadReq))
            .Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();

        // Archive it
        using var archiveReq = WebApiFixture.BuildRequest(
            HttpMethod.Patch, $"/api/v1/applications/{app.Id}/documents/{docId}/archive",
            token: token);
        (await _fx.Client.SendAsync(archiveReq)).StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Default list: archived NOT included
        using var listReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/documents", token: token);
        var listJson = (await (await _fx.Client.SendAsync(listReq))
            .Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        listJson.Should().NotContain(d => d.GetProperty("id").GetGuid() == docId);

        // With includeArchived=true: document appears
        using var archivedListReq = WebApiFixture.BuildRequest(
            HttpMethod.Get,
            $"/api/v1/applications/{app.Id}/documents?includeArchived=true",
            token: token);
        var archivedListJson = (await (await _fx.Client.SendAsync(archivedListReq))
            .Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        archivedListJson.Should().Contain(d =>
            d.GetProperty("id").GetGuid() == docId &&
            d.GetProperty("isArchived").GetBoolean());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static MultipartFormDataContent BuildDocumentForm(
        string documentType, string fileName, string contentType, string? displayName = null)
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(documentType), "DocumentType");
        if (displayName is not null)
            form.Add(new StringContent(displayName), "DisplayName");

        var filePart = new ByteArrayContent(FakePdfBytes());
        filePart.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        form.Add(filePart, "File", fileName);

        return form;
    }

    private static HttpRequestMessage BuildMultipartRequest(
        string url, MultipartFormDataContent content, string? token)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
        if (token is not null)
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return req;
    }

    // Minimal PDF magic bytes
    private static byte[] FakePdfBytes() =>
        "%PDF-1.4\n1 0 obj\n<< >>\nendobj\n"u8.ToArray();

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
