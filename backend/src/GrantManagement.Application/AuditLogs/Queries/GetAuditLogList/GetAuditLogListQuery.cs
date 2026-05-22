using GrantManagement.Application.AuditLogs.DTOs;
using GrantManagement.Application.Common.Models;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.AuditLogs.Queries.GetAuditLogList;

public record GetAuditLogListQuery(
    int Page = 1,
    int PageSize = 50,
    Guid? UserId = null,
    DateTimeOffset? DateFrom = null,
    DateTimeOffset? DateTo = null,
    string? EntityType = null,
    Guid? EntityId = null,
    AuditAction? Action = null) : IRequest<PagedResult<AuditLogItemDto>>;
