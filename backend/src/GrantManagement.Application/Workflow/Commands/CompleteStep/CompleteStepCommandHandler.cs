using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.CompleteStep;

public class CompleteStepCommandHandler : IRequestHandler<CompleteStepCommand, WorkflowStepDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CompleteStepCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<WorkflowStepDetailDto> Handle(CompleteStepCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        application.CompleteStep(request.StepType, _currentUser.UserId);
        await _context.SaveChangesAsync(cancellationToken);

        var step = application.WorkflowSteps.First(s => s.StepType == request.StepType);

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
            SkippedReason = step.SkippedReason,
        };
    }
}
