using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.ApproveStep;

public class ApproveStepCommandHandler
    : IRequestHandler<ApproveStepCommand, WorkflowStepDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ApproveStepCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<WorkflowStepDetailDto> Handle(
        ApproveStepCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        var step = application.WorkflowSteps
            .FirstOrDefault(s => s.StepType == request.StepType)
            ?? throw new DomainException($"A(z) {request.StepType} lépés nem található.");

        if (request.IsApproved)
        {
            if (request.StepType == WorkflowStepType.Submission)
                application.ApproveSubmission(_currentUser.UserId);
            else
                throw new DomainException($"A(z) {request.StepType} lépés jóváhagyása nem támogatott.");
        }
        else
        {
            step.Reject(_currentUser.UserId, request.RejectionNote!);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new WorkflowStepDetailDto
        {
            Id = step.Id,
            StepType = step.StepType.ToString(),
            Status = step.Status.ToString(),
            Order = step.Order,
            IsSkippable = step.IsSkippable,
            CompletedAt = step.CompletedAt,
            CompletedByUserId = step.CompletedByUserId,
            ApprovedAt = step.ApprovedAt,
            ApprovedByUserId = step.ApprovedByUserId,
            RejectionNote = step.RejectionNote,
            SubmittedAt = request.StepType == WorkflowStepType.Submission
                ? application.SubmissionData?.SubmittedAt
                : null,
            SubmissionMethodId = request.StepType == WorkflowStepType.Submission
                ? application.SubmissionData?.SubmissionMethodId
                : null,
            ExternalIdentifier = request.StepType == WorkflowStepType.Submission
                ? application.SubmissionData?.ExternalIdentifier
                : null,
            Notes = request.StepType == WorkflowStepType.Submission
                ? application.SubmissionData?.Description
                : null
        };
    }
}
