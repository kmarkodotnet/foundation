using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.RestoreStep;

[RequireRole(UserRole.Admin, UserRole.Elnok)]
public record RestoreStepCommand(
    Guid ApplicationId,
    WorkflowStepType StepType
) : IRequest<WorkflowStepDetailDto>, IApplicationCommand;
