using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GrantManagement.Domain.Enums;
using GrantManagement.Integration.Tests.Infrastructure;

namespace GrantManagement.Integration.Tests.Granters;

[Collection("WebApi")]
public class GranterEndpointTests
{
    private readonly WebApiFixture _fx;

    public GranterEndpointTests(WebApiFixture fx) => _fx = fx;

    // ─── US-100: Create Granter ───────────────────────────────────────────────

    [SkippableFact]
    public async Task CreateGranter_ValidPayload_Returns201WithGranterDto()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.PalyazatiMunkatars);
        var body = new
        {
            name = $"Teszt Pályáztató {Guid.NewGuid():N}",
            description = "Regionális fejlesztési alap.",
            phoneNumber = "+36 1 234 5678",
            email = "info@palyaztato.hu"
        };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/granters", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("name").GetString().Should().Be(body.name);
        json.GetProperty("email").GetString().Should().Be("info@palyaztato.hu");
        json.GetProperty("status").GetString().Should().Be("Active");
        json.GetProperty("id").GetGuid().Should().NotBeEmpty();
    }

    [SkippableFact]
    public async Task CreateGranter_DuplicateName_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var name = $"Duplikált Pályáztató {Guid.NewGuid():N}";
        var body = new { name, description = (string?)null, phoneNumber = (string?)null, email = (string?)null };

        using var req1 = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/granters", body, token);
        (await _fx.Client.SendAsync(req1)).StatusCode.Should().Be(HttpStatusCode.Created);

        using var req2 = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/granters", body, token);
        var response = await _fx.Client.SendAsync(req2);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task CreateGranter_InvalidEmail_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.PalyazatiMunkatars);
        var body = new
        {
            name = $"Pályáztató {Guid.NewGuid():N}",
            description = (string?)null,
            phoneNumber = (string?)null,
            email = "nem-valid-email"
        };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/granters", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task CreateGranter_EmptyName_Returns422()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var body = new { name = "", description = (string?)null, phoneNumber = (string?)null, email = (string?)null };

        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/granters", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task CreateGranter_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new { name = "Névtelen pályáztató", description = (string?)null, phoneNumber = (string?)null, email = (string?)null };

        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/granters")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task GetGranters_AfterCreate_ReturnsListContainingNewGranter()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Megtekinto);
        var adminToken = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var name = $"Listázható Pályáztató {Guid.NewGuid():N}";

        var createBody = new { name, description = (string?)null, phoneNumber = (string?)null, email = (string?)null };
        using var createReq = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/granters", createBody, adminToken);
        (await _fx.Client.SendAsync(createReq)).StatusCode.Should().Be(HttpStatusCode.Created);

        using var listReq = WebApiFixture.BuildRequest(HttpMethod.Get, "/api/v1/granters", token: token);
        var listResponse = await _fx.Client.SendAsync(listReq);

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await listResponse.Content.ReadFromJsonAsync<JsonElement>())
            .EnumerateArray().ToList();
        items.Should().Contain(g => g.GetProperty("name").GetString() == name);
    }

    // ─── US-101: Edit Granter ────────────────────────────────────────────────

    [SkippableFact]
    public async Task UpdateGranter_ValidPayload_Returns200WithUpdatedFields()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.PalyazatiMunkatars);
        var granterId = await CreateGranterAsync($"Módosítandó Pályáztató {Guid.NewGuid():N}", token);

        var updateBody = new
        {
            name = $"Módosított Név {Guid.NewGuid():N}",
            description = "Frissített leírás.",
            phoneNumber = "+36 30 000 0000",
            email = "frissitett@palyaztato.hu"
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/granters/{granterId}", updateBody, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("name").GetString().Should().Be(updateBody.name);
        json.GetProperty("description").GetString().Should().Be("Frissített leírás.");
        json.GetProperty("email").GetString().Should().Be("frissitett@palyaztato.hu");
        json.GetProperty("id").GetGuid().Should().Be(granterId);
    }

    [SkippableFact]
    public async Task UpdateGranter_DuplicateName_Returns400()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var existingName = $"Meglévő Pályáztató {Guid.NewGuid():N}";
        await CreateGranterAsync(existingName, token);

        var targetGranterId = await CreateGranterAsync($"Átnevezendő Pályáztató {Guid.NewGuid():N}", token);

        var updateBody = new
        {
            name = existingName,
            description = (string?)null,
            phoneNumber = (string?)null,
            email = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/granters/{targetGranterId}", updateBody, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task UpdateGranter_WithoutJwt_Returns401()
    {
        _fx.SkipIfDockerUnavailable();

        var body = new { name = "Frissítés JWT nélkül", description = (string?)null, phoneNumber = (string?)null, email = (string?)null };

        using var req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/granters/{Guid.NewGuid()}")
        {
            Content = JsonContent.Create(body)
        };
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task UpdateGranter_NonExistent_Returns404()
    {
        _fx.SkipIfDockerUnavailable();

        var token = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var body = new
        {
            name = $"Nem létező {Guid.NewGuid():N}",
            description = (string?)null,
            phoneNumber = (string?)null,
            email = (string?)null
        };

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Put, $"/api/v1/granters/{Guid.NewGuid()}", body, token);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task DeactivateGranter_AsAdmin_Returns204()
    {
        _fx.SkipIfDockerUnavailable();

        var adminToken = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var granterId = await CreateGranterAsync($"Deaktiválandó Pályáztató {Guid.NewGuid():N}", adminToken);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Patch, $"/api/v1/granters/{granterId}/deactivate", token: adminToken);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task DeactivateGranter_AsPalyazatiMunkatars_Returns403()
    {
        _fx.SkipIfDockerUnavailable();

        var adminToken = _fx.GenerateJwt(Guid.NewGuid(), UserRole.Admin);
        var munkatarsToken = _fx.GenerateJwt(Guid.NewGuid(), UserRole.PalyazatiMunkatars);
        var granterId = await CreateGranterAsync($"Pályáztató {Guid.NewGuid():N}", adminToken);

        using var req = WebApiFixture.BuildRequest(
            HttpMethod.Patch, $"/api/v1/granters/{granterId}/deactivate", token: munkatarsToken);
        var response = await _fx.Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<Guid> CreateGranterAsync(string name, string token)
    {
        var body = new { name, description = (string?)null, phoneNumber = (string?)null, email = (string?)null };
        using var req = WebApiFixture.BuildRequest(HttpMethod.Post, "/api/v1/granters", body, token);
        var resp = await _fx.Client.SendAsync(req);
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await resp.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }
}
