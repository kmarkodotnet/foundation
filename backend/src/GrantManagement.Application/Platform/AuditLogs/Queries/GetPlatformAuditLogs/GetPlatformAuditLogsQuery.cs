using GrantManagement.Application.AuditLogs.DTOs;
using MediatR;

namespace GrantManagement.Application.Platform.AuditLogs.Queries.GetPlatformAuditLogs;

public record GetPlatformAuditLogsQuery(
    Guid? UserId,
    Guid? OwnerId,
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate,
    string? Action,
    int Page = 1,
    int PageSize = 50) : IRequest<GetPlatformAuditLogsResponse>;

public record GetPlatformAuditLogsResponse(IReadOnlyList<AuditLogItemDto> Items, int TotalCount);
