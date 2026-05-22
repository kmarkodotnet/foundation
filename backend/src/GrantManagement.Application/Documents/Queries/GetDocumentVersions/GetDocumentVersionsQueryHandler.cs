using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Documents.Queries.GetDocumentVersions;

public class GetDocumentVersionsQueryHandler : IRequestHandler<GetDocumentVersionsQuery, List<DocumentVersionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDocumentVersionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<DocumentVersionDto>> Handle(
        GetDocumentVersionsQuery request,
        CancellationToken cancellationToken)
    {
        // First find the reference document to get WorkflowStepId and DocumentType
        // Use IgnoreQueryFilters — the DocumentId could refer to an archived version
        var refDoc = await _context.Documents
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(d => d.Id == request.DocumentId &&
                _context.WorkflowSteps.Any(ws =>
                    ws.ApplicationId == request.ApplicationId && ws.Id == d.WorkflowStepId))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Document", request.DocumentId);

        // Load all versions: same WorkflowStep + same DocumentType (all archived and active)
        var versions = await _context.Documents
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(d =>
                d.WorkflowStepId == refDoc.WorkflowStepId &&
                d.DocumentType == refDoc.DocumentType)
            .OrderByDescending(d => d.Version)
            .ToListAsync(cancellationToken);

        // Resolve uploader names
        var userIds = versions.Select(d => d.UploadedByUserId).Distinct().ToList();
        var users = await _context.AppUsers
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, cancellationToken);

        return versions.Select(d => new DocumentVersionDto
        {
            Id = d.Id,
            Version = d.Version,
            FileName = d.FileName,
            DisplayName = d.DisplayName,
            UploadedAt = d.CreatedAt,
            UploadedByName = users.GetValueOrDefault(d.UploadedByUserId, "Ismeretlen"),
            IsArchived = d.IsArchived
        }).ToList();
    }
}
