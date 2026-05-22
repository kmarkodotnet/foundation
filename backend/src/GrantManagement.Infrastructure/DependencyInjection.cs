using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Interfaces.Services;
using GrantManagement.Infrastructure.Auth;
using GrantManagement.Infrastructure.BackgroundJobs;
using GrantManagement.Infrastructure.Email;
using GrantManagement.Infrastructure.FileStorage;
using GrantManagement.Infrastructure.Identity;
using GrantManagement.Infrastructure.Notifications;
using GrantManagement.Infrastructure.Persistence;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GrantManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<AppDbContext>());

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.Configure<SmtpSettings>(configuration.GetSection("Smtp"));
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddSingleton<IEmailParser, EmailParserService>();

        var uploadsPath = configuration["FileStorage:BasePath"] ?? "data/uploads";
        services.AddSingleton<IFileStorageService>(_ => new LocalFileStorageService(uploadsPath));

        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString)));

        services.AddHangfireServer();
        services.AddScoped<DeadlineCheckJob>();
        services.AddScoped<INotificationService, NotificationService>();

        services.AddHttpClient();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        services.AddScoped<IJwtService, JwtService>();

        return services;
    }
}
