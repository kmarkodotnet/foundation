using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.CorrectResult;

[RequireRole(UserRole.Admin)]
public record CorrectResultCommand(
    Guid ApplicationId,
    bool IsWon,
    decimal? AwardedAmount,
    DateOnly? ResultDate,
    string? ResultIdentifier
) : IRequest<ApplicationDetailDto>, IApplicationCommand;
