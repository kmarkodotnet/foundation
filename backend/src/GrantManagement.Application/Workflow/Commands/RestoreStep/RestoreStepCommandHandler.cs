using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.RestoreStep;

public class RestoreStepCommandHandler
    : IRequestHandler<RestoreStepCommand, WorkflowStepDetailDto>
{
    private readonly IApplicationDbContext _context;

    public RestoreStepCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<WorkflowStepDetailDto> Handle(
        RestoreStepCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        application.ReactivateStep(request.StepType);
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
