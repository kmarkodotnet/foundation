using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.ApproveStep;

[RequireRole(UserRole.Admin, UserRole.Elnok)]
public record ApproveStepCommand(
    Guid ApplicationId,
    WorkflowStepType StepType,
    bool IsApproved,
    string? RejectionNote
) : IRequest<WorkflowStepDetailDto>, IApplicationCommand;
