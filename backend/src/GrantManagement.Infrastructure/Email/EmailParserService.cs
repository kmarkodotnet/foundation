using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.DTOs;
using MimeKit;

namespace GrantManagement.Infrastructure.Email;

public class EmailParserService : IEmailParser
{
    public EmlPreviewDto? Parse(Stream stream)
    {
        try
        {
            var message = MimeMessage.Load(stream);
            var from = message.From.ToString();
            var body = message.TextBody ?? message.HtmlBody;

            return new EmlPreviewDto
            {
                From = string.IsNullOrEmpty(from) ? null : from,
                Subject = message.Subject,
                Date = message.Date == default ? null : message.Date,
                Body = body
            };
        }
        catch
        {
            return null;
        }
    }
}
