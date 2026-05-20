using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.UpdateSubmissionStep;

public class UpdateSubmissionStepCommandHandler
    : IRequestHandler<UpdateSubmissionStepCommand, WorkflowStepDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateSubmissionStepCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<WorkflowStepDetailDto> Handle(
        UpdateSubmissionStepCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        var submissionStep = application.WorkflowSteps
            .FirstOrDefault(s => s.StepType == WorkflowStepType.Submission)
            ?? throw new DomainException("A beadás lépés nem található.");

        if (submissionStep.Status != WorkflowStepStatus.Active)
            throw new DomainException("A beadás lépés nem szerkeszthető ebben az állapotban.");

        var data = new SubmissionStepData
        {
            SubmittedAt = request.SubmittedAt,
            SubmissionMethodId = request.SubmissionMethodId,
            ExternalIdentifier = request.ExternalIdentifier,
            Description = request.Notes,
            SubmittedByUserId = _currentUser.UserId
        };

        application.RecordSubmission(data, _currentUser.UserId);
        await _context.SaveChangesAsync(cancellationToken);

        string? methodName = null;
        if (request.SubmissionMethodId.HasValue)
        {
            var item = await _context.CodeListItems
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == request.SubmissionMethodId.Value, cancellationToken);
            methodName = item?.Name;
        }

        return new WorkflowStepDetailDto
        {
            Id = submissionStep.Id,
            StepType = submissionStep.StepType.ToString(),
            Status = submissionStep.Status.ToString(),
            Order = submissionStep.Order,
            IsSkippable = submissionStep.IsSkippable,
            CompletedAt = submissionStep.CompletedAt,
            CompletedByUserId = submissionStep.CompletedByUserId,
            ApprovedAt = submissionStep.ApprovedAt,
            ApprovedByUserId = submissionStep.ApprovedByUserId,
            RejectionNote = submissionStep.RejectionNote,
            SubmittedAt = request.SubmittedAt,
            SubmissionMethodId = request.SubmissionMethodId,
            SubmissionMethodName = methodName,
            ExternalIdentifier = request.ExternalIdentifier,
            Notes = request.Notes
        };
    }
}
