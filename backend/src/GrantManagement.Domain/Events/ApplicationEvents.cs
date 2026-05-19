using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Events;

public record ApplicationCreated(
    Guid ApplicationId,
    string Title,
    Guid GranterId,
    DateTimeOffset SubmissionDeadline,
    Guid CreatedByUserId
) : DomainEvent;

public record ApplicationSubmitted(
    Guid ApplicationId,
    DateTimeOffset SubmittedAt,
    Guid SubmittedByUserId
) : DomainEvent;

public record ApplicationWon(
    Guid ApplicationId,
    Money AwardedAmount,
    DateOnly ResultDate,
    Guid RecordedByUserId
) : DomainEvent;

public record ApplicationLost(
    Guid ApplicationId,
    DateOnly ResultDate,
    Guid RecordedByUserId
) : DomainEvent;

public record ApprovalRequired(
    Guid ApplicationId,
    WorkflowStepType StepType,
    Guid RequestedByUserId
) : DomainEvent;

public record SettlementApproved(
    Guid ApplicationId,
    Guid ApprovedByUserId,
    DateTimeOffset ApprovedAt
) : DomainEvent;

public record DocumentAttached(
    Guid ApplicationId,
    WorkflowStepType StepType,
    Guid DocumentId,
    string FileName,
    Guid UploadedByUserId
) : DomainEvent;

public record CommentAdded(
    Guid ApplicationId,
    WorkflowStepType StepType,
    Guid CommentId,
    Guid AuthorUserId
) : DomainEvent;

public record SubmissionDeadlineAlert(
    Guid ApplicationId,
    DateTimeOffset Deadline,
    int DaysRemaining
) : DomainEvent;
