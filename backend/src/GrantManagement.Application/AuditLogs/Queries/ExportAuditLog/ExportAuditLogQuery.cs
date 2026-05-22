using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.AuditLogs.Queries.ExportAuditLog;

public record ExportAuditLogQuery(
    Guid? UserId = null,
    DateTimeOffset? DateFrom = null,
    DateTimeOffset? DateTo = null,
    string? EntityType = null,
    AuditAction? Action = null) : IRequest<byte[]>;
