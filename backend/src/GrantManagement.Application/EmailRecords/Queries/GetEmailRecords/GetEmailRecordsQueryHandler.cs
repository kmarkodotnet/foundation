using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;
using GrantManagement.Application.EmailRecords.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.EmailRecords.Queries.GetEmailRecords;

public class GetEmailRecordsQueryHandler
    : IRequestHandler<GetEmailRecordsQuery, List<EmailRecordDto>>
{
    private readonly IApplicationDbContext _context;

    public GetEmailRecordsQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<List<EmailRecordDto>> Handle(
        GetEmailRecordsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.EmailRecords
            .AsNoTracking()
            .Where(e => e.ApplicationId == request.ApplicationId);

        if (request.WorkflowStepId.HasValue)
            query = query.Where(e => e.WorkflowStepId == request.WorkflowStepId.Value);

        var records = await query
            .OrderByDescending(e => e.SentDate)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync(cancellationToken);

        if (records.Count == 0)
            return [];

        var userIds = records.Select(r => r.CreatedByUserId).Distinct().ToList();
        var users = await _context.AppUsers
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name })
            .ToDictionaryAsync(u => u.Id, u => u.Name, cancellationToken);

        return records
            .Select(r => CreateEmailRecordCommandHandler.MapToDto(
                r, users.TryGetValue(r.CreatedByUserId, out var name) ? name : "Ismeretlen"))
            .ToList();
    }
}
