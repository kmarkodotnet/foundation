using System.Text;
using GrantManagement.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.AuditLogs.Queries.ExportAuditLog;

public class ExportAuditLogQueryHandler : IRequestHandler<ExportAuditLogQuery, byte[]>
{
    private readonly IApplicationDbContext _context;

    public ExportAuditLogQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> Handle(ExportAuditLogQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = from log in _context.AuditLogs
                        join user in _context.AppUsers
                            on log.UserId equals user.Id into userGroup
                        from u in userGroup.DefaultIfEmpty()
                        select new { log, UserName = (string?)u.Name, UserEmail = (string?)u.Email };

        if (request.UserId.HasValue)
            baseQuery = baseQuery.Where(x => x.log.UserId == request.UserId.Value);

        if (request.DateFrom.HasValue)
            baseQuery = baseQuery.Where(x => x.log.CreatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            baseQuery = baseQuery.Where(x => x.log.CreatedAt <= request.DateTo.Value);

        if (!string.IsNullOrWhiteSpace(request.EntityType))
            baseQuery = baseQuery.Where(x => x.log.EntityType == request.EntityType);

        if (request.Action.HasValue)
            baseQuery = baseQuery.Where(x => x.log.Action == request.Action.Value);

        var rows = await baseQuery
            .OrderByDescending(x => x.log.CreatedAt)
            .Select(x => new
            {
                x.log.Id,
                x.log.CreatedAt,
                x.UserName,
                x.UserEmail,
                x.log.EntityType,
                x.log.EntityId,
                Action = x.log.Action.ToString(),
                x.log.FieldName,
                x.log.OldValue,
                x.log.NewValue,
                x.log.IpAddress
            })
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Id,Időbélyeg,Felhasználó neve,E-mail,Entitás típus,Entitás ID,Művelet,Mező,Régi érték,Új érték,IP cím");

        foreach (var row in rows)
        {
            sb.AppendLine(string.Join(",",
                row.Id,
                row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                Escape(row.UserName),
                Escape(row.UserEmail),
                Escape(row.EntityType),
                row.EntityId,
                row.Action,
                Escape(row.FieldName),
                Escape(row.OldValue),
                Escape(row.NewValue),
                Escape(row.IpAddress)));
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    private static string Escape(string? value)
    {
        if (value is null) return string.Empty;
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
