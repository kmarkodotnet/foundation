using GrantManagement.Domain.Interfaces;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Options;

namespace GrantManagement.Infrastructure.Email;

public class SmtpSettings
{
    public string Host { get; init; } = null!;
    public int Port { get; init; } = 587;
    public string UserName { get; init; } = null!;
    public string Password { get; init; } = null!;
    public string FromEmail { get; init; } = null!;
    public string FromName { get; init; } = null!;
    public bool UseSsl { get; init; } = true;
}

public class SmtpEmailService : IEmailService
{
    private readonly SmtpSettings _settings;

    public SmtpEmailService(IOptions<SmtpSettings> settings)
        => _settings = settings.Value;

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        var mimeMessage = BuildMimeMessage(message);
        await SendInternalAsync(mimeMessage, ct);
    }

    public async Task SendBulkAsync(IEnumerable<EmailMessage> messages, CancellationToken ct = default)
    {
        using var client = await CreateConnectedClientAsync(ct);
        foreach (var message in messages)
        {
            var mimeMessage = BuildMimeMessage(message);
            await client.SendAsync(mimeMessage, ct);
        }
        await client.DisconnectAsync(true, ct);
    }

    private MimeMessage BuildMimeMessage(EmailMessage message)
    {
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        mimeMessage.To.Add(MailboxAddress.Parse(message.To));
        mimeMessage.Subject = message.Subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.PlainTextBody
        };
        mimeMessage.Body = bodyBuilder.ToMessageBody();
        return mimeMessage;
    }

    private async Task SendInternalAsync(MimeMessage mimeMessage, CancellationToken ct)
    {
        using var client = await CreateConnectedClientAsync(ct);
        await client.SendAsync(mimeMessage, ct);
        await client.DisconnectAsync(true, ct);
    }

    private async Task<SmtpClient> CreateConnectedClientAsync(CancellationToken ct)
    {
        var client = new SmtpClient();
        await client.ConnectAsync(_settings.Host, _settings.Port, _settings.UseSsl, ct);
        await client.AuthenticateAsync(_settings.UserName, _settings.Password, ct);
        return client;
    }
}
