using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Settlement.Commands.RequestSettlementApproval;

[RequireRole(UserRole.Admin, UserRole.Penzugyes)]
public record RequestSettlementApprovalCommand(Guid ApplicationId) : IRequest<Unit>, IApplicationCommand, IAuditableCommand
{
    public string AuditEntityType => "Application";
    public Guid AuditEntityId => ApplicationId;
    public AuditAction AuditAction => AuditAction.StatusChange;
}
