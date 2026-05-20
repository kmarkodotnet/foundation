namespace GrantManagement.Domain.ValueObjects;

public sealed record SubmissionStepData
{
    public DateTimeOffset SubmittedAt { get; init; }
    public Guid? SubmissionMethodId { get; init; }
    public string? ExternalIdentifier { get; init; }
    public string? Description { get; init; }
    public Guid SubmittedByUserId { get; init; }
}
