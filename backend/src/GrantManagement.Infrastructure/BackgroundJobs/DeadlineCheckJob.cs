using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GrantManagement.Infrastructure.BackgroundJobs;

public class DeadlineCheckJob
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<DeadlineCheckJob> _logger;

    public DeadlineCheckJob(IApplicationDbContext context, ILogger<DeadlineCheckJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Running deadline check job");

        var now = DateTimeOffset.UtcNow;
        var warningThreshold = now.AddDays(7);

        var applicationsWithUpcomingDeadline = await _context.Applications
            .AsNoTracking()
            .Where(a => !a.IsArchived
                && a.Status == ApplicationStatus.Draft
                && a.CallData != null
                && a.CallData.SubmissionDeadline <= warningThreshold
                && a.CallData.SubmissionDeadline > now)
            .ToListAsync();

        foreach (var application in applicationsWithUpcomingDeadline)
        {
            var daysRemaining = (int)(application.CallData!.SubmissionDeadline - now).TotalDays;
            _logger.LogInformation(
                "Application {Id} deadline approaching in {Days} days",
                application.Id,
                daysRemaining);
        }
    }
}
