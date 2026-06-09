using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.RecordResult;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record RecordResultCommand(
    Guid ApplicationId,
    bool IsWon,
    decimal? AwardedAmount,
    DateOnly? ResultDate,
    string? ResultIdentifier
) : IRequest<ApplicationDetailDto>, IApplicationCommand, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.StatusChange;
}
