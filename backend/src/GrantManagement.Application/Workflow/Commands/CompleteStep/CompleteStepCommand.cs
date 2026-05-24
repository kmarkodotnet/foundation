using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.CompleteStep;

public record CompleteStepCommand(Guid ApplicationId, WorkflowStepType StepType) : IRequest<WorkflowStepDetailDto>;
