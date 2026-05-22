using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class EmailRecord : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid? WorkflowStepId { get; private set; }
    public string Subject { get; private set; } = null!;
    public string SenderEmail { get; private set; } = null!;
    public DateOnly SentDate { get; private set; }
    public EmailDirection Direction { get; private set; }
    public string? ContentSummary { get; private set; }
    public string? AttachmentStoragePath { get; private set; }
    public string? AttachmentFileName { get; private set; }
    public string? AttachmentContentType { get; private set; }
    public string? EmlFrom { get; private set; }
    public string? EmlSubject { get; private set; }
    public DateTimeOffset? EmlDate { get; private set; }
    public string? EmlBody { get; private set; }
    public bool IsDeleted { get; private set; }
    public Guid CreatedByUserId { get; private set; }

    private EmailRecord() { }

    public static EmailRecord Create(
        Guid applicationId,
        string subject,
        string senderEmail,
        DateOnly sentDate,
        EmailDirection direction,
        Guid createdByUserId,
        Guid? workflowStepId = null,
        string? contentSummary = null)
    {
        return new EmailRecord
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            WorkflowStepId = workflowStepId,
            Subject = subject,
            SenderEmail = senderEmail,
            SentDate = sentDate,
            Direction = direction,
            CreatedByUserId = createdByUserId,
            ContentSummary = contentSummary,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void AttachFile(string storagePath, string fileName, string contentType)
    {
        AttachmentStoragePath = storagePath;
        AttachmentFileName = fileName;
        AttachmentContentType = contentType;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetEmlPreview(string? from, string? subject, DateTimeOffset? date, string? body)
    {
        EmlFrom = from;
        EmlSubject = subject;
        EmlDate = date;
        EmlBody = body;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
