using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Tenancy.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace GrantManagement.Infrastructure.BackgroundJobs;

public sealed class BreakGlassExpirationJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BreakGlassExpirationJob> _logger;

    public BreakGlassExpirationJob(
        IServiceScopeFactory scopeFactory,
        ILogger<BreakGlassExpirationJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [ScopeBypassAllowed("Background job — processes all owners explicitly")]
    public async Task ExecuteAsync()
    {
        await using var serviceScope = _scopeFactory.CreateAsyncScope();
        var db = serviceScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTimeOffset.UtcNow;
        var expiredGrants = await db.BreakGlassGrants
            .Where(g => g.Status == BreakGlassStatus.Active && g.ExpiresAt < now)
            .ToListAsync();

        foreach (var grant in expiredGrants)
        {
            grant.MarkExpired();
            _logger.LogInformation(
                "BreakGlassGrant {GrantId} lejárt és EXPIRED státuszra állítva.", grant.Id);

            db.AuditLogs.Add(AuditLog.Record(
                entityType: "BreakGlassGrant",
                entityId: grant.Id,
                action: AuditAction.BreakGlassExpired,
                userId: grant.PlatformAdminUserId,
                ipAddress: null,
                ownerId: grant.TargetOwnerId));
        }

        if (expiredGrants.Count > 0)
            await db.SaveChangesAsync();
    }
}
