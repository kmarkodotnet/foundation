using GrantManagement.Application.Settlement.DTOs;
using MediatR;

namespace GrantManagement.Application.Settlement.Queries.GetSettlement;

public record GetSettlementQuery(Guid ApplicationId) : IRequest<SettlementDto?>;
