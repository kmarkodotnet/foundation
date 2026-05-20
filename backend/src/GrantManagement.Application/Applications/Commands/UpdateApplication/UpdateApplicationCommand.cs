using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Applications.Commands.UpdateApplication;

[RequireRole(UserRole.Admin, UserRole.Elnok, UserRole.PalyazatiMunkatars)]
public record UpdateApplicationCommand(
    Guid ApplicationId,
    string Title,
    string? Identifier,
    string? Description,
    DateTimeOffset SubmissionDeadline,
    decimal? MinAmount,
    decimal? MaxAmount,
    DateOnly? SpendingDeadline,
    Guid? ApplicationTypeId,
    string? OtherMetadata
) : IRequest<ApplicationDetailDto>, IApplicationCommand;
