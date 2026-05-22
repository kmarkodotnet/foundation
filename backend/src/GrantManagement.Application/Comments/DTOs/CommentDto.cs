namespace GrantManagement.Application.Comments.DTOs;

public class CommentDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public Guid? WorkflowStepId { get; init; }
    public string Body { get; init; } = null!;
    public Guid AuthorId { get; init; }
    public string AuthorName { get; init; } = null!;
    public string? AuthorAvatarUrl { get; init; }
    public bool IsDeleted { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
