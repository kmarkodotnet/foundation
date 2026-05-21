using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Settlement.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Settlement.Commands.RecordSettlement;

[RequireRole(UserRole.Admin, UserRole.Penzugyes)]
public record RecordSettlementCommand : IRequest<SettlementDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public DateOnly SettlementDate { get; init; }
    public Guid? SettlementMethodId { get; init; }
    public string? Description { get; init; }
    public string? Notes { get; init; }
}
