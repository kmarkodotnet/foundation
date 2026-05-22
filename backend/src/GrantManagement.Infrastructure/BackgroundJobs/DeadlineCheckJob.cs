using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GrantManagement.Infrastructure.BackgroundJobs;

public class DeadlineCheckJob
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<DeadlineCheckJob> _logger;

    public DeadlineCheckJob(
        IApplicationDbContext context,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger<DeadlineCheckJob> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Running deadline check job");

        await CheckSubmissionDeadlinesAsync();
        await CheckSpendingDeadlinesAsync();
    }

    private async Task CheckSubmissionDeadlinesAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var warningCutoff = now.AddDays(7);
        var missedCutoff = now.AddDays(-1);

        var applications = await _context.Applications
            .AsNoTracking()
            .Where(a => !a.IsArchived
                && (a.Status == ApplicationStatus.Draft || a.Status == ApplicationStatus.InProgress)
                && a.CallData != null)
            .Select(a => new
            {
                a.Id,
                a.Title,
                Deadline = a.CallData!.SubmissionDeadline
            })
            .ToListAsync();

        var notifyRoles = new[] { UserRole.PalyazatiMunkatars, UserRole.Elnok };
        var relevantUsers = await _context.AppUsers
            .AsNoTracking()
            .Where(u => notifyRoles.Contains(u.Role))
            .ToListAsync();

        foreach (var app in applications)
        {
            var deadlineDt = app.Deadline;

            bool isApproaching = deadlineDt > now && deadlineDt <= warningCutoff;
            bool isMissed = deadlineDt >= missedCutoff && deadlineDt < now;

            if (!isApproaching && !isMissed) continue;

            var type = isApproaching
                ? NotificationType.SubmissionDeadlineApproaching
                : NotificationType.SubmissionDeadlineMissed;

            var existingToday = await _context.Notifications
                .AsNoTracking()
                .AnyAsync(n =>
                    n.RelatedEntityId == app.Id
                    && n.Type == type
                    && n.CreatedAt >= todayStart);

            if (existingToday) continue;

            int daysRemaining = (int)(deadlineDt - now).TotalDays;
            string deadlineStr = deadlineDt.ToString("yyyy.MM.dd");

            string title = isApproaching
                ? $"Közeledő beadási határidő ({daysRemaining} nap)"
                : "Lejárt beadási határidő";

            string body = isApproaching
                ? $"A(z) \"{app.Title}\" pályázat beadási határideje {daysRemaining} nap múlva lejár ({deadlineStr})."
                : $"A(z) \"{app.Title}\" pályázat beadási határideje lejárt ({deadlineStr}).";

            foreach (var user in relevantUsers)
            {
                try
                {
                    await _notificationService.CreateAndPushAsync(
                        user.Id, type, title, body, app.Id, "Application");

                    bool sendEmail = isApproaching
                        ? user.NotificationPrefs.EmailOnDeadlineApproaching
                        : user.NotificationPrefs.EmailOnDeadlineMissed;

                    if (sendEmail)
                    {
                        await _emailService.SendAsync(new EmailMessage(
                            user.Email, title,
                            $"<p>{body}</p>",
                            body));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to notify user {UserId} for application {AppId}",
                        user.Id, app.Id);
                }
            }
        }
    }

    private async Task CheckSpendingDeadlinesAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var warningCutoff = now.AddDays(14);

        var applications = await _context.Applications
            .AsNoTracking()
            .Where(a => !a.IsArchived
                && a.Status == ApplicationStatus.Won
                && a.CallData != null
                && a.CallData.SpendingDeadline != null)
            .Select(a => new
            {
                a.Id,
                a.Title,
                SpendingDeadline = a.CallData!.SpendingDeadline,
                AwardedAmountValue = a.Result != null ? a.Result.AwardedAmountValue : null
            })
            .ToListAsync();

        var notifyRoles = new[] { UserRole.Penzugyes, UserRole.Elnok };
        var relevantUsers = await _context.AppUsers
            .AsNoTracking()
            .Where(u => notifyRoles.Contains(u.Role))
            .ToListAsync();

        foreach (var app in applications)
        {
            if (app.SpendingDeadline is null) continue;

            var deadlineDt = new DateTimeOffset(
                app.SpendingDeadline.Value.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);

            bool isApproaching = deadlineDt > now && deadlineDt <= warningCutoff;
            if (!isApproaching) continue;

            var existingToday = await _context.Notifications
                .AsNoTracking()
                .AnyAsync(n =>
                    n.RelatedEntityId == app.Id
                    && n.Type == NotificationType.SpendingDeadlineApproaching
                    && n.CreatedAt >= todayStart);

            if (existingToday) continue;

            int daysRemaining = (int)(deadlineDt - now).TotalDays;

            string title = $"Közeledő felhasználási határidő ({daysRemaining} nap)";
            string amountInfo = app.AwardedAmountValue.HasValue
                ? $" (megítélt összeg: {app.AwardedAmountValue.Value:N0} Ft)"
                : string.Empty;
            string body = $"A(z) \"{app.Title}\" pályázat felhasználási határideje {daysRemaining} nap múlva lejár ({app.SpendingDeadline:yyyy.MM.dd}){amountInfo}.";

            foreach (var user in relevantUsers)
            {
                try
                {
                    await _notificationService.CreateAndPushAsync(
                        user.Id,
                        NotificationType.SpendingDeadlineApproaching,
                        title,
                        body,
                        app.Id,
                        "Application");

                    if (user.NotificationPrefs.EmailOnDeadlineApproaching)
                    {
                        await _emailService.SendAsync(new EmailMessage(
                            user.Email, title,
                            $"<p>{body}</p>",
                            body));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to notify user {UserId} for spending deadline of application {AppId}",
                        user.Id, app.Id);
                }
            }
        }
    }
}
