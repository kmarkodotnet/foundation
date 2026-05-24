using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Interfaces.Services;
using GrantManagement.Infrastructure.FileStorage;
using GrantManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Moq;
using Testcontainers.PostgreSql;

namespace GrantManagement.Integration.Tests.Infrastructure;

public sealed class WebApiFixture : IAsyncLifetime
{
    internal const string JwtSecret = "this-is-a-test-secret-key-at-least-32-chars-long!";
    internal const string JwtIssuer = "grant-management-test";

    private PostgreSqlContainer? _postgres;
    private bool _dockerAvailable;
    private WebApplicationFactory<Program>? _factory;

    public Mock<IGoogleAuthService> GoogleAuthMock { get; } = new();
    public HttpClient Client { get; private set; } = null!;
    public string ConnectionString { get; private set; } = string.Empty;
    public bool DockerAvailable => _dockerAvailable;

    public async Task InitializeAsync()
    {
        _postgres = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .Build();

        try
        {
            await _postgres.StartAsync();
            ConnectionString = _postgres.GetConnectionString();
        }
        catch (Exception ex) when (IsDockerUnavailable(ex))
        {
            // Docker nem fut — a tesztek skippelik magukat
            return;
        }

        _dockerAvailable = true;

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");

                builder.ConfigureTestServices(services =>
                {
                    // Override AppDbContext to use Testcontainers database instead of production
                    var dbDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (dbDescriptor is not null)
                        services.Remove(dbDescriptor);

                    var contextDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(AppDbContext));
                    if (contextDescriptor is not null)
                        services.Remove(contextDescriptor);

                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseNpgsql(ConnectionString));

                    // Override JWT validation to use test credentials
                    services.PostConfigure<JwtBearerOptions>(
                        JwtBearerDefaults.AuthenticationScheme,
                        options =>
                        {
                            options.TokenValidationParameters = new TokenValidationParameters
                            {
                                ValidateIssuer = true,
                                ValidateAudience = false,
                                ValidateLifetime = true,
                                ValidateIssuerSigningKey = true,
                                ValidIssuer = JwtIssuer,
                                IssuerSigningKey = new SymmetricSecurityKey(
                                    Encoding.UTF8.GetBytes(JwtSecret))
                            };
                        });

                    // Remove Hangfire background server to avoid production database polling in tests
                    var hangfireHosted = services
                        .Where(d => d.ServiceType == typeof(Microsoft.Extensions.Hosting.IHostedService) &&
                                    d.ImplementationType?.FullName?.Contains("Hangfire") == true)
                        .ToList();
                    foreach (var d in hangfireHosted)
                        services.Remove(d);

                    // Override file storage to use a temp directory (avoids 'data/uploads' path issues)
                    var fileStorageDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(IFileStorageService));
                    if (fileStorageDescriptor is not null)
                        services.Remove(fileStorageDescriptor);

                    var testUploadsPath = Path.Combine(Path.GetTempPath(), "grant-test-uploads");
                    Directory.CreateDirectory(testUploadsPath);
                    services.AddSingleton<IFileStorageService>(_ => new LocalFileStorageService(testUploadsPath));

                    services.AddScoped<IGoogleAuthService>(_ => GoogleAuthMock.Object);
                });
            });

        Client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    public AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    public string GenerateJwt(Guid userId, UserRole role, string email = "test@test.local")
    {
        Claim[] claims =
        [
            new(JwtRegisteredClaimNames.Sub, $"google-{userId:N}"),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Name, "Test User"),
            new("role", role.ToString()),
            new("userId", userId.ToString())
        ];

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: null,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static HttpRequestMessage BuildRequest(
        HttpMethod method,
        string url,
        object? body = null,
        string? token = null)
    {
        var msg = new HttpRequestMessage(method, url);
        if (body is not null)
            msg.Content = JsonContent.Create(body);
        if (token is not null)
            msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return msg;
    }

    public void SkipIfDockerUnavailable() =>
        Skip.If(!_dockerAvailable,
            "Docker nem fut vagy nincs konfigurálva. Indítsd el a Docker Desktop-ot, majd futtasd újra.");

    public async Task DisposeAsync()
    {
        if (_factory is not null)
            await _factory.DisposeAsync();

        if (_dockerAvailable && _postgres is not null)
        {
            await _postgres.StopAsync();
            await _postgres.DisposeAsync();
        }
    }

    private static bool IsDockerUnavailable(Exception ex)
        => ex is ArgumentException { ParamName: "DockerEndpointAuthConfig" }
           || (ex is InvalidOperationException && ex.Message.Contains("Docker", StringComparison.OrdinalIgnoreCase))
           || ex.Message.Contains("Docker", StringComparison.OrdinalIgnoreCase)
           || (ex.InnerException is not null && IsDockerUnavailable(ex.InnerException));
}

[CollectionDefinition("WebApi")]
public class WebApiCollection : ICollectionFixture<WebApiFixture> { }
