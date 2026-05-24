using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.ProofRecords;

[Collection("WebApi")]
public class ProofRecordEndpointTests
{
    private readonly WebApiFixture _fx;

    public ProofRecordEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-065: Record Proof of Completion ───────────────────────────────────

    [SkippableFact]
    public async Task CreateProofRecord_ValidMultipart_Returns201()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        using var form = BuildProofRecordForm("Event", "2025-10-15", notes: null, withPhoto: true);
        using var req = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/proof-records", form, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("applicationId").GetGuid().Should().Be(app.Id);
        json.GetProperty("proofType").GetString().Should().Be("Event");
        json.GetProperty("photos").GetArrayLength().Should().Be(1);
    }

    [SkippableFact]
    public async Task CreateProofRecord_NoPhotos_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Admin);

        using var form = BuildProofRecordForm("Asset", "2025-10-15", notes: null, withPhoto: false);
        using var req = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/proof-records", form, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task GetProofRecords_AfterCreate_ReturnsListWithRecord()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.PalyazatiMunkatars);

        // Create a proof record
        using var form = BuildProofRecordForm("Event", "2025-11-01", notes: "Rendezvény megtörtént", withPhoto: true);
        using var createReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/proof-records", form, token);
        (await _fx.Client.SendAsync(createReq)).StatusCode.Should().Be(HttpStatusCode.Created);

        // GET the list
        using var listReq = WebApiFixture.BuildRequest(
            HttpMethod.Get, $"/api/v1/applications/{app.Id}/proof-records", token: token);
        var listResponse = await _fx.Client.SendAsync(listReq);

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        json.GetArrayLength().Should().BeGreaterThanOrEqualTo(1);
        json[0].GetProperty("proofType").GetString().Should().Be("Event");
    }

    [SkippableFact]
    public async Task CreateProofRecord_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var form = BuildProofRecordForm("Event", "2025-10-15", notes: null, withPhoto: true);
        using var req = BuildMultipartRequest(
            $"/api/v1/applications/{Guid.NewGuid()}/proof-records", form, token: null);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── US-066: View and Download Proof Photos ───────────────────────────────

    [SkippableFact]
    public async Task GetProofPhoto_ValidPhotoId_Returns200WithImageContent()
    {
        _fx.SkipIfDockerUnavailable();

        var userId = Guid.NewGuid();
        var app = await SeedWonApplicationAsync(userId);
        var token = _fx.GenerateJwt(userId, UserRole.Megtekinto);

        // Create a proof record with a photo (as admin to bypass role check)
        var adminToken = _fx.GenerateJwt(userId, UserRole.Admin);
        using var form = BuildProofRecordForm("Event", "2025-10-20", notes: null, withPhoto: true);
        using var createReq = BuildMultipartRequest(
            $"/api/v1/applications/{app.Id}/proof-records", form, adminToken);
        var createResp = await _fx.Client.SendAsync(createReq);
        createResp.StatusCode.Should().Be(HttpStatusCode.Created);

        var createJson = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var recordId = createJson.GetProperty("id").GetGuid();
        var photoId = createJson.GetProperty("photos")[0].GetProperty("id").GetGuid();

        // Download the photo
        using var photoReq = WebApiFixture.BuildRequest(
            HttpMethod.Get,
            $"/api/v1/applications/{app.Id}/proof-records/{recordId}/photos/{photoId}",
            token: token);
        var photoResp = await _fx.Client.SendAsync(photoReq);

        photoResp.StatusCode.Should().Be(HttpStatusCode.OK);
        photoResp.Content.Headers.ContentType?.MediaType.Should().StartWith("image/");
    }

    [SkippableFact]
    public async Task GetProofPhoto_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/v1/applications/{Guid.NewGuid()}/proof-records/{Guid.NewGuid()}/photos/{Guid.NewGuid()}");
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task DownloadAllProofPhotos_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        using var req = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/v1/applications/{Guid.NewGuid()}/proof-records/{Guid.NewGuid()}/photos/download-all");
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static MultipartFormDataContent BuildProofRecordForm(
        string proofType, string eventDate, string? notes, bool withPhoto)
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(proofType), "ProofType");
        form.Add(new StringContent(eventDate), "EventDate");
        if (notes is not null)
            form.Add(new StringContent(notes), "Notes");

        if (withPhoto)
        {
            // Minimal valid JPEG header bytes
            var imageBytes = new byte[]
            {
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
            };
            var filePart = new ByteArrayContent(imageBytes);
            filePart.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");
            form.Add(filePart, "Photos", "test-photo.jpg");
        }

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
