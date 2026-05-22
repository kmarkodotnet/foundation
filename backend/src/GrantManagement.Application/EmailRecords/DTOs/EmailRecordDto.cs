namespace GrantManagement.Application.EmailRecords.DTOs;

public record EmailRecordDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public Guid? WorkflowStepId { get; init; }
    public string Subject { get; init; } = null!;
    public string SenderEmail { get; init; } = null!;
    public DateOnly SentDate { get; init; }
    public string Direction { get; init; } = null!;
    public string? ContentSummary { get; init; }
    public bool HasAttachment { get; init; }
    public string? AttachmentFileName { get; init; }
    public Guid CreatedByUserId { get; init; }
    public string CreatedByName { get; init; } = null!;
    public DateTimeOffset CreatedAt { get; init; }
}
