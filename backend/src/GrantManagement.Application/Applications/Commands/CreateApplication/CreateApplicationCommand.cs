using GrantManagement.Application.Applications.DTOs;
using MediatR;

namespace GrantManagement.Application.Applications.Commands.CreateApplication;

public record CreateApplicationCommand(
    string Title,
    Guid GranterId,
    DateTimeOffset SubmissionDeadline,
    string? Identifier = null,
    string? Description = null,
    Guid? ApplicationTypeId = null,
    decimal? MinAmount = null,
    decimal? MaxAmount = null,
    DateOnly? SpendingDeadline = null,
    string? OtherMetadata = null
) : IRequest<ApplicationDetailDto>;
