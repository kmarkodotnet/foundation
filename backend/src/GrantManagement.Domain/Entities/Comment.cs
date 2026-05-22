using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class Comment : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid? WorkflowStepId { get; private set; }
    public string Body { get; private set; } = null!;
    public Guid AuthorId { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }

    private Comment() { }

    public static Comment Create(
        Guid applicationId,
        string body,
        Guid authorId,
        Guid? workflowStepId = null)
    {
        return new Comment
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            WorkflowStepId = workflowStepId,
            Body = body,
            AuthorId = authorId,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Edit(string newBody)
    {
        Body = newBody;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
        Body = "[Megjegyzés törölve]";
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
