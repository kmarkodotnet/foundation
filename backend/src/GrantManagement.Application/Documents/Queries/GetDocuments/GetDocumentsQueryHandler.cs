using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.Commands.UploadDocument;
using GrantManagement.Application.Documents.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Documents.Queries.GetDocuments;

public class GetDocumentsQueryHandler : IRequestHandler<GetDocumentsQuery, List<DocumentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDocumentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<DocumentDto>> Handle(GetDocumentsQuery request, CancellationToken cancellationToken)
    {
        // Build base query
        IQueryable<GrantManagement.Domain.Entities.Document> query = _context.Documents.AsNoTracking();

        if (request.IncludeArchived)
            query = query.IgnoreQueryFilters();

        // Filter by application — join through WorkflowSteps
        query = query.Where(d =>
            _context.WorkflowSteps.Any(ws =>
                ws.ApplicationId == request.ApplicationId && ws.Id == d.WorkflowStepId));

        if (request.WorkflowStepId.HasValue)
            query = query.Where(d => d.WorkflowStepId == request.WorkflowStepId.Value);

        var docs = await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        // Resolve uploader names in a single query
        var userIds = docs.Select(d => d.UploadedByUserId).Distinct().ToList();
        var users = await _context.AppUsers
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, cancellationToken);

        return docs
            .Select(d => UploadDocumentCommandHandler.MapToDto(d, users.GetValueOrDefault(d.UploadedByUserId, "Ismeretlen")))
            .ToList();
    }
}
