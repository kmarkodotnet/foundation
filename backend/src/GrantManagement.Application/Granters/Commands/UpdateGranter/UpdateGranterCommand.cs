using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Granters.Commands.UpdateGranter;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record UpdateGranterCommand(
    Guid GranterId,
    string Name,
    string? Description,
    string? PhoneNumber,
    string? Email
) : IRequest<GranterDto>, IAuditableCommand
{
    public string AuditEntityType => "Granter";
    public Guid AuditEntityId => GranterId;
    public AuditAction AuditAction => AuditAction.Update;
}
