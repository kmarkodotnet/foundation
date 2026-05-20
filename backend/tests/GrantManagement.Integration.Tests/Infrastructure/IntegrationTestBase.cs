using GrantManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace GrantManagement.Integration.Tests.Infrastructure;

public abstract class IntegrationTestBase : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private string _connectionString = string.Empty;
    private bool _dockerAvailable;

    protected AppDbContext DbContext { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        try
        {
            await _postgres.StartAsync();
            _connectionString = _postgres.GetConnectionString();
            DbContext = CreateContext();
            await DbContext.Database.MigrateAsync();
            _dockerAvailable = true;
        }
        catch (Exception ex) when (IsDockerUnavailable(ex))
        {
            // Docker nem fut — a tesztek skippelik magukat
        }
    }

    public async Task DisposeAsync()
    {
        if (!_dockerAvailable) return;

        await DbContext.DisposeAsync();
        await _postgres.StopAsync();
        await _postgres.DisposeAsync();
    }

    protected AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString)
            .Options;
        return new AppDbContext(options);
    }

    // Tesztek hívják az első sorban — ha Docker nincs, azonnal skippelik
    protected void SkipIfDockerUnavailable()
        => Skip.If(!_dockerAvailable,
            "A Docker nem fut vagy nincs konfigurálva. Indítsd el a Docker Desktop-ot, majd futtasd újra.");

    private static bool IsDockerUnavailable(Exception ex)
        => ex is ArgumentNullException { ParamName: "DockerEndpointAuthConfig" }
           || ex is InvalidOperationException
           || ex.Message.Contains("Docker", StringComparison.OrdinalIgnoreCase)
           || ex.InnerException is not null && IsDockerUnavailable(ex.InnerException);
}
