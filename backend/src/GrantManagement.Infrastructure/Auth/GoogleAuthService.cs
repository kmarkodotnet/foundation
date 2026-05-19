using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using System.Text.Json.Serialization;
using GrantManagement.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GrantManagement.Infrastructure.Auth;

public sealed class GoogleAuthService : IGoogleAuthService
{
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GoogleAuthService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<GoogleUserInfo> ExchangeCodeAsync(
        string code,
        string redirectUri,
        CancellationToken cancellationToken = default)
    {
        var tokenResponse = await RequestTokenAsync(code, redirectUri, cancellationToken);
        return ExtractUserInfoFromIdToken(tokenResponse.IdToken);
    }

    private async Task<GoogleTokenResponse> RequestTokenAsync(
        string code,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        var clientId = _configuration["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId is not configured.");

        var clientSecret = _configuration["Google:ClientSecret"]
            ?? throw new InvalidOperationException("Google:ClientSecret is not configured.");

        var formParameters = new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["redirect_uri"] = redirectUri,
            ["grant_type"] = "authorization_code"
        };

        using var httpClient = _httpClientFactory.CreateClient();
        using var content = new FormUrlEncodedContent(formParameters);

        var response = await httpClient.PostAsync(TokenEndpoint, content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Google token exchange failed: {StatusCode} — {Body}",
                response.StatusCode, errorBody);
            throw new UnauthorizedAccessException("Google authorization code exchange failed.");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var tokenResponse = JsonSerializer.Deserialize<GoogleTokenResponse>(json)
            ?? throw new InvalidOperationException("Failed to deserialize Google token response.");

        return tokenResponse;
    }

    private static GoogleUserInfo ExtractUserInfoFromIdToken(string idToken)
    {
        var handler = new JwtSecurityTokenHandler();

        if (!handler.CanReadToken(idToken))
            throw new UnauthorizedAccessException("Invalid Google id_token.");

        var jwt = handler.ReadJwtToken(idToken);

        var googleId = jwt.Subject
            ?? throw new UnauthorizedAccessException("Missing 'sub' claim in id_token.");

        var email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value
            ?? throw new UnauthorizedAccessException("Missing 'email' claim in id_token.");

        var name = jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? email;
        var picture = jwt.Claims.FirstOrDefault(c => c.Type == "picture")?.Value;

        return new GoogleUserInfo(googleId, email, name, picture);
    }

    private sealed class GoogleTokenResponse
    {
        [JsonPropertyName("id_token")]
        public string IdToken { get; init; } = string.Empty;

        [JsonPropertyName("access_token")]
        public string AccessToken { get; init; } = string.Empty;
    }
}
