using GrantManagement.Application.AuditLogs.DTOs;
using MediatR;

namespace GrantManagement.Application.OwnerAdministration.AuditLogs.Queries.GetOwnerAuditLogs;

public record GetOwnerAuditLogsQuery(
    Guid? FoundationId,
    Guid? UserId,
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate,
    string? EntityType,
    string? Action,
    int Page = 1,
    int PageSize = 25) : IRequest<GetOwnerAuditLogsResponse>;

public record GetOwnerAuditLogsResponse(IReadOnlyList<AuditLogItemDto> Items, int TotalCount);
