using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GrantManagement.Infrastructure.BackgroundJobs;

public class InvitationExpiryJob
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<InvitationExpiryJob> _logger;

    public InvitationExpiryJob(IApplicationDbContext context, ILogger<InvitationExpiryJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var now = DateTimeOffset.UtcNow;

        var expiredInvitations = await _context.Invitations
            .Where(i => i.Status == InvitationStatus.Pending && i.ExpiresAt < now)
            .ToListAsync();

        if (expiredInvitations.Count == 0)
        {
            _logger.LogInformation("Invitation expiry job: no expired invitations found.");
            return;
        }

        foreach (var invitation in expiredInvitations)
            invitation.MarkAsExpired();

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Invitation expiry job: marked {Count} invitations as expired.",
            expiredInvitations.Count);
    }
}
