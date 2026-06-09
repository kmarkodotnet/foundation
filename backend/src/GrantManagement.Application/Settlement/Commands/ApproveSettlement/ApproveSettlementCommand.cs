using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Settlement.Commands.ApproveSettlement;

[RequireRole(UserRole.Admin, UserRole.Elnok)]
public record ApproveSettlementCommand : IRequest<ApplicationDetailDto>, IApplicationCommand, IAuditableCommand
{
    public Guid ApplicationId { get; init; }
    public bool IsApproved { get; init; }
    public string? RejectionNote { get; init; }

    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => IsApproved ? AuditAction.Approve : AuditAction.StatusChange;
}
