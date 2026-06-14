using GrantManagement.Application.AuditLogs.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.AuditLogs.Queries.GetAuditLogList;

public class GetAuditLogListQueryHandler
    : IRequestHandler<GetAuditLogListQuery, PagedResult<AuditLogItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAuditLogListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AuditLogItemDto>> Handle(
        GetAuditLogListQuery request,
        CancellationToken cancellationToken)
    {
        var query = from log in _context.AuditLogs
                    join user in _context.AppUsers
                        on log.UserId equals user.Id into userGroup
                    from u in userGroup.DefaultIfEmpty()
                    select new { log, UserName = (string?)u.Name, UserEmail = (string?)u.Email };

        if (request.UserId.HasValue)
            query = query.Where(x => x.log.UserId == request.UserId.Value);

        if (request.DateFrom.HasValue)
            query = query.Where(x => x.log.CreatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            query = query.Where(x => x.log.CreatedAt <= request.DateTo.Value);

        if (!string.IsNullOrWhiteSpace(request.EntityType))
            query = query.Where(x => x.log.EntityType == request.EntityType);

        if (request.EntityId.HasValue)
            query = query.Where(x => x.log.EntityId == request.EntityId.Value);

        if (request.Action.HasValue)
            query = query.Where(x => x.log.Action == request.Action.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.log.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new AuditLogItemDto
            {
                Id = x.log.Id,
                CreatedAt = x.log.CreatedAt,
                UserId = x.log.UserId,
                UserName = x.UserName,
                UserEmail = x.UserEmail,
                EntityType = x.log.EntityType,
                EntityId = x.log.EntityId,
                Action = x.log.Action.ToString(),
                FieldName = x.log.FieldName,
                OldValue = x.log.OldValue,
                NewValue = x.log.NewValue,
                IpAddress = x.log.IpAddress,
                OwnerId = x.log.OwnerId,
                FoundationId = x.log.FoundationId
            })
            .ToListAsync(cancellationToken);

        return PagedResult<AuditLogItemDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
