using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Documents.Commands.ArchiveDocument;

public class ArchiveDocumentCommandHandler : IRequestHandler<ArchiveDocumentCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public ArchiveDocumentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(ArchiveDocumentCommand request, CancellationToken cancellationToken)
    {
        // Load document (active only — respects !IsArchived global filter)
        // Verify ownership through WorkflowStep
        var doc = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId &&
                _context.WorkflowSteps.Any(ws =>
                    ws.ApplicationId == request.ApplicationId && ws.Id == d.WorkflowStepId),
                cancellationToken)
            ?? throw new NotFoundException("Document", request.DocumentId);

        doc.Archive();
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
