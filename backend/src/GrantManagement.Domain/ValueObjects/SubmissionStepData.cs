namespace GrantManagement.Domain.ValueObjects;

public sealed record SubmissionStepData
{
    public string? Description { get; init; }
    public Guid? SubmissionMethodId { get; init; }
    public DateTimeOffset SubmittedAt { get; init; }
    public Guid SubmittedByUserId { get; init; }
}
