using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public enum EmailDirection { In, Out }

public class EmailAttachment : BaseEntity<Guid>
{
    public Guid WorkflowStepId { get; private set; }
    public string Subject { get; private set; } = null!;
    public string SenderEmail { get; private set; } = null!;
    public DateOnly SentDate { get; private set; }
    public EmailDirection Direction { get; private set; }
    public string? ContentSummary { get; private set; }
    public string? FilePath { get; private set; }
    public Guid AddedByUserId { get; private set; }

    private EmailAttachment() { }

    public static EmailAttachment Create(
        Guid workflowStepId,
        string subject,
        string senderEmail,
        DateOnly sentDate,
        EmailDirection direction,
        Guid addedByUserId,
        string? contentSummary = null,
        string? filePath = null)
    {
        return new EmailAttachment
        {
            Id = Guid.NewGuid(),
            WorkflowStepId = workflowStepId,
            Subject = subject,
            SenderEmail = senderEmail,
            SentDate = sentDate,
            Direction = direction,
            ContentSummary = contentSummary,
            FilePath = filePath,
            AddedByUserId = addedByUserId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
