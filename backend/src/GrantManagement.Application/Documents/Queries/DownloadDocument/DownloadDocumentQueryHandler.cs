using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Documents.Queries.DownloadDocument;

public class DownloadDocumentQueryHandler : IRequestHandler<DownloadDocumentQuery, DocumentFileResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public DownloadDocumentQueryHandler(
        IApplicationDbContext context,
        IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentFileResult> Handle(DownloadDocumentQuery request, CancellationToken cancellationToken)
    {
        // Use IgnoreQueryFilters so archived documents can also be downloaded (version history)
        var doc = await _context.Documents
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(d => d.Id == request.DocumentId &&
                _context.WorkflowSteps.Any(ws =>
                    ws.ApplicationId == request.ApplicationId && ws.Id == d.WorkflowStepId))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Document", request.DocumentId);

        var stream = await _fileStorage.GetFileAsync(doc.StoragePath, cancellationToken);
        return new DocumentFileResult(stream, doc.ContentType, doc.FileName);
    }
}
