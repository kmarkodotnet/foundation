using System.Text;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.AuditLogs.Commands.ExportOwnerAuditLogs;

public sealed class ExportOwnerAuditLogsCsvCommandHandler : IRequestHandler<ExportOwnerAuditLogsCsvCommand, ExportOwnerAuditLogsCsvResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;

    public ExportOwnerAuditLogsCsvCommandHandler(IApplicationDbContext db, ICurrentScopeService scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<ExportOwnerAuditLogsCsvResponse> Handle(
        ExportOwnerAuditLogsCsvCommand request,
        CancellationToken cancellationToken)
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

        var records = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.CreatedAt,
                a.EntityType,
                a.EntityId,
                Action = a.Action.ToString(),
                a.UserId,
                a.IpAddress,
                a.OwnerId,
                a.FoundationId
            })
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("CreatedAt,EntityType,EntityId,Action,UserId,IpAddress,OwnerId,FoundationId");

        foreach (var r in records)
        {
            sb.AppendLine(string.Join(",",
                r.CreatedAt.ToString("o"),
                Escape(r.EntityType),
                r.EntityId,
                Escape(r.Action),
                r.UserId,
                Escape(r.IpAddress),
                r.OwnerId?.ToString() ?? "",
                r.FoundationId?.ToString() ?? ""));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"audit-{DateTimeOffset.UtcNow:yyyyMMdd}.csv";

        return new ExportOwnerAuditLogsCsvResponse(bytes, fileName);
    }

    private static string Escape(string? value)
        => value is null ? "" : $"\"{value.Replace("\"", "\"\"")}\"";
}
