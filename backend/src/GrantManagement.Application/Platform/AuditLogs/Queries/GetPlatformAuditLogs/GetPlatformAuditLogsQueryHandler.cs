using GrantManagement.Application.AuditLogs.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.AuditLogs.Queries.GetPlatformAuditLogs;

public sealed class GetPlatformAuditLogsQueryHandler : IRequestHandler<GetPlatformAuditLogsQuery, GetPlatformAuditLogsResponse>
{
    private readonly IApplicationDbContext _db;

    public GetPlatformAuditLogsQueryHandler(IApplicationDbContext db) => _db = db;

    [ScopeBypassAllowed("Platform-level audit log requires cross-owner access")]
    public async Task<GetPlatformAuditLogsResponse> Handle(GetPlatformAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.AuditLogs.AsNoTracking().AsQueryable();

        if (request.UserId.HasValue)
            query = query.Where(a => a.UserId == request.UserId.Value);
        if (request.OwnerId.HasValue)
            query = query.Where(a => a.OwnerId == request.OwnerId.Value);
        if (request.StartDate.HasValue)
            query = query.Where(a => a.CreatedAt >= request.StartDate.Value);
        if (request.EndDate.HasValue)
            query = query.Where(a => a.CreatedAt <= request.EndDate.Value);
        if (!string.IsNullOrEmpty(request.Action) && Enum.TryParse<AuditAction>(request.Action, true, out var actionEnum))
            query = query.Where(a => a.Action == actionEnum);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AuditLogItemDto
            {
                Id = a.Id,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                Action = a.Action.ToString(),
                UserId = a.UserId,
                IpAddress = a.IpAddress,
                CreatedAt = a.CreatedAt,
                OwnerId = a.OwnerId,
                FoundationId = a.FoundationId
            })
            .ToListAsync(cancellationToken);

        return new GetPlatformAuditLogsResponse(items, total);
    }
}
