using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Applications.Commands.CreateApplication;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
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
) : IRequest<ApplicationDetailDto>, IAuditableCreateCommand<ApplicationDetailDto>
{
    public string AuditEntityType => "Application";
    public AuditAction AuditAction => AuditAction.Create;
    public Guid GetEntityId(ApplicationDetailDto response) => response.Id;
}
