using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Domain.Entities;

public class WorkflowStep : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public WorkflowStepType StepType { get; private set; }
    public WorkflowStepStatus Status { get; private set; }
    public int Order { get; private set; }
    public bool IsSkippable { get; private set; }
    public string? SkippedReason { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public Guid? CompletedByUserId { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }
    public string? RejectionNote { get; private set; }

    private readonly List<Document> _documents = [];
    private readonly List<Comment> _comments = [];
    private readonly List<EmailAttachment> _emailAttachments = [];

    public IReadOnlyList<Document> Documents => _documents.AsReadOnly();
    public IReadOnlyList<Comment> Comments => _comments.AsReadOnly();
    public IReadOnlyList<EmailAttachment> EmailAttachments => _emailAttachments.AsReadOnly();

    private WorkflowStep() { }

    public static WorkflowStep Create(
        Guid applicationId,
        WorkflowStepType stepType,
        int order,
        bool isSkippable = false)
    {
        return new WorkflowStep
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            StepType = stepType,
            Status = order == 1 ? WorkflowStepStatus.Active : WorkflowStepStatus.Pending,
            Order = order,
            IsSkippable = isSkippable,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Activate()
    {
        Status = WorkflowStepStatus.Active;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Complete(Guid completedByUserId)
    {
        Status = WorkflowStepStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
        CompletedByUserId = completedByUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Approve(Guid approvedByUserId)
    {
        ApprovedAt = DateTimeOffset.UtcNow;
        ApprovedByUserId = approvedByUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Reject(Guid rejectedByUserId, string rejectionNote)
    {
        RejectionNote = rejectionNote;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Skip(string? reason, Guid skippedByUserId)
    {
        Status = WorkflowStepStatus.Skipped;
        SkippedReason = reason;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Reactivate()
    {
        Status = WorkflowStepStatus.Active;
        CompletedAt = null;
        CompletedByUserId = null;
        RejectionNote = null;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Lock()
    {
        Status = WorkflowStepStatus.Locked;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void AddDocument(Document document) => _documents.Add(document);
    internal void AddComment(Comment comment) => _comments.Add(comment);
    internal void AddEmailAttachment(EmailAttachment emailAttachment) => _emailAttachments.Add(emailAttachment);
}
