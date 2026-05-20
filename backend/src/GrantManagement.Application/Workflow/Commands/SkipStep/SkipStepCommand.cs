using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.SkipStep;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record SkipStepCommand(
    Guid ApplicationId,
    WorkflowStepType StepType,
    string? SkipReason
) : IRequest<WorkflowStepDetailDto>, IApplicationCommand;
