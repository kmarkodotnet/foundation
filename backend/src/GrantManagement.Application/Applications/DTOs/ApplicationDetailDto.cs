using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Applications.DTOs;

public class ApplicationDetailDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = null!;
    public string? Identifier { get; init; }
    public string? Description { get; init; }
    public ApplicationStatus Status { get; init; }
    public Guid GranterId { get; init; }
    public string GranterName { get; init; } = null!;
    public bool IsArchived { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public string CreatedByUserName { get; init; } = null!;
    public IReadOnlyList<WorkflowStepDto> WorkflowSteps { get; init; } = [];

    // CallStepData fields
    public DateTimeOffset SubmissionDeadline { get; init; }
    public DateOnly? SpendingDeadline { get; init; }
    public decimal? MinAmount { get; init; }
    public decimal? MaxAmount { get; init; }
    public string? ApplicationTypeName { get; init; }
    public string? OtherMetadata { get; init; }

    // Result fields
    public decimal? AwardedAmount { get; init; }
    public DateOnly? ResultDate { get; init; }
    public string? ResultIdentifier { get; init; }

    // Granter contract data
    public string? GranterContractIdentifier { get; init; }
    public DateOnly? GranterContractDate { get; init; }
    public bool? GranterNotificationReceived { get; init; }
    public DateOnly? GranterNotificationDate { get; init; }
}

public class WorkflowStepDto
{
    public Guid Id { get; init; }
    public WorkflowStepType StepType { get; init; }
    public WorkflowStepStatus Status { get; init; }
    public int Order { get; init; }
    public bool IsSkippable { get; init; }
    public DateTimeOffset? CompletedAt { get; init; }
    public DateTimeOffset? ApprovedAt { get; init; }
    public string? RejectionNote { get; init; }
    public string? SkippedReason { get; init; }
}
