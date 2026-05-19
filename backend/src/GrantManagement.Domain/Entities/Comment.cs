using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class Comment : BaseEntity<Guid>
{
    public Guid WorkflowStepId { get; private set; }
    public string Text { get; private set; } = null!;
    public Guid AuthorUserId { get; private set; }
    public bool IsDeleted { get; private set; }

    private Comment() { }

    public static Comment Create(Guid workflowStepId, string text, Guid authorUserId)
    {
        return new Comment
        {
            Id = Guid.NewGuid(),
            WorkflowStepId = workflowStepId,
            Text = text,
            AuthorUserId = authorUserId,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Edit(string newText)
    {
        Text = newText;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Delete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
