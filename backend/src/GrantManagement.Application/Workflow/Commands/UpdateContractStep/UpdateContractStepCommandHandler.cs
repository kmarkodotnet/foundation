using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.UpdateContractStep;

public class UpdateContractStepCommandHandler
    : IRequestHandler<UpdateContractStepCommand, WorkflowStepDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateContractStepCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<WorkflowStepDetailDto> Handle(
        UpdateContractStepCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        var contractStep = application.WorkflowSteps
            .FirstOrDefault(s => s.StepType == WorkflowStepType.Contract)
            ?? throw new DomainException("A szerződés lépés nem található.");

        if (contractStep.Status != WorkflowStepStatus.Active)
            throw new DomainException("A szerződés lépés nem szerkeszthető ebben az állapotban.");

        var data = new GranterContractData
        {
            ContractIdentifier = request.ContractIdentifier,
            ContractDate = request.ContractDate,
            NotificationReceived = request.NotificationReceived,
            NotificationDate = request.NotificationDate,
        };

        application.RecordGranterContract(data);

        if (request.Complete)
            application.CompleteStep(WorkflowStepType.Contract, _currentUser.UserId);

        await _context.SaveChangesAsync(cancellationToken);

        return new WorkflowStepDetailDto
        {
            Id = contractStep.Id,
            StepType = contractStep.StepType.ToString(),
            Status = contractStep.Status.ToString(),
            Order = contractStep.Order,
            IsSkippable = contractStep.IsSkippable,
            CompletedAt = contractStep.CompletedAt,
            CompletedByUserId = contractStep.CompletedByUserId,
            ApprovedAt = contractStep.ApprovedAt,
            ApprovedByUserId = contractStep.ApprovedByUserId,
            RejectionNote = contractStep.RejectionNote,
            SkippedReason = contractStep.SkippedReason,
            ContractIdentifier = request.ContractIdentifier,
            ContractDate = request.ContractDate,
            NotificationReceived = request.NotificationReceived,
            NotificationDate = request.NotificationDate,
        };
    }
}
