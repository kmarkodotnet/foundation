using GrantManagement.Application.AuditLogs.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.AuditLogs.Queries.GetOwnerAuditLogs;

public sealed class GetOwnerAuditLogsQueryHandler : IRequestHandler<GetOwnerAuditLogsQuery, GetOwnerAuditLogsResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;

    public GetOwnerAuditLogsQueryHandler(IApplicationDbContext db, ICurrentScopeService scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<GetOwnerAuditLogsResponse> Handle(GetOwnerAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges.");

        var query = _db.AuditLogs.AsNoTracking().Where(a => a.OwnerId == ownerId);

        if (request.FoundationId.HasValue)
            query = query.Where(a => a.FoundationId == request.FoundationId.Value);
        if (request.UserId.HasValue)
            query = query.Where(a => a.UserId == request.UserId.Value);
        if (request.StartDate.HasValue)
            query = query.Where(a => a.CreatedAt >= request.StartDate.Value);
        if (request.EndDate.HasValue)
            query = query.Where(a => a.CreatedAt <= request.EndDate.Value);
        if (!string.IsNullOrEmpty(request.EntityType))
            query = query.Where(a => a.EntityType == request.EntityType);
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
                FoundationId = a.FoundationId,
                IsBreakGlass = a.Action == AuditAction.BreakGlassAccess
            })
            .ToListAsync(cancellationToken);

        return new GetOwnerAuditLogsResponse(items, total);
    }
}
