namespace GrantManagement.Application.Workflow.DTOs;

public class WorkflowStepDetailDto
{
    public Guid Id { get; init; }
    public string StepType { get; init; } = null!;
    public string Status { get; init; } = null!;
    public int Order { get; init; }
    public bool IsSkippable { get; init; }
    public DateTimeOffset? CompletedAt { get; init; }
    public Guid? CompletedByUserId { get; init; }
    public DateTimeOffset? ApprovedAt { get; init; }
    public Guid? ApprovedByUserId { get; init; }
    public string? RejectionNote { get; init; }
    public string? SkippedReason { get; init; }

    // Submission step fields
    public DateTimeOffset? SubmittedAt { get; init; }
    public Guid? SubmissionMethodId { get; init; }
    public string? SubmissionMethodName { get; init; }
    public string? ExternalIdentifier { get; init; }
    public string? Notes { get; init; }

    // ContractGranter step fields
    public string? ContractIdentifier { get; init; }
    public DateOnly? ContractDate { get; init; }
    public bool? NotificationReceived { get; init; }
    public DateOnly? NotificationDate { get; init; }
}
