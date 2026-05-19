namespace GrantManagement.Domain.Interfaces;

public record EmailMessage(
    string To,
    string Subject,
    string HtmlBody,
    string? PlainTextBody = null);

public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
    Task SendBulkAsync(IEnumerable<EmailMessage> messages, CancellationToken ct = default);
}
