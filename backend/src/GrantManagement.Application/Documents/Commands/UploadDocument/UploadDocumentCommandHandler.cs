using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Documents.Commands.UploadDocument;

public class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, DocumentDto>
{
    private static readonly HashSet<string> AllowedMimeTypes =
    [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "message/rfc822",
        "application/vnd.ms-outlook"
    ];

    private const long MaxFileSizeBytes = 50L * 1024 * 1024;

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;

    public UploadDocumentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IFileStorageService fileStorage)
    {
        _context = context;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentDto> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        // Load Application with WorkflowSteps — xmin-safe (no filtered include on WorkflowSteps)
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        WorkflowStep step;
        if (request.WorkflowStepId.HasValue)
        {
            step = application.WorkflowSteps.FirstOrDefault(s => s.Id == request.WorkflowStepId.Value)
                ?? throw new NotFoundException("WorkflowStep", request.WorkflowStepId.Value);
        }
        else
        {
            step = application.WorkflowSteps.FirstOrDefault(s => s.Status == WorkflowStepStatus.Active)
                ?? throw new DomainException("Nincs aktív munkafolyamat lépés.");
        }

        if (!AllowedMimeTypes.Contains(request.File.ContentType))
            throw new DomainException("Ez a fájlformátum nem támogatott.");

        if (request.File.Length > MaxFileSizeBytes)
            throw new DomainException("A fájl mérete meghaladja a 50 MB-os korlátot.");

        var storagePath = await _fileStorage.SaveFileAsync(
            request.File.Stream,
            request.File.FileName,
            request.File.ContentType,
            cancellationToken);

        var doc = application.AttachDocument(
            step.StepType,
            request.DocumentType,
            request.File.FileName,
            storagePath,
            request.File.Length,
            request.File.ContentType,
            _currentUser.UserId,
            request.DisplayName);

        // EF Core tracks entities discovered via navigation with non-default Guid keys as Unchanged.
        // Explicitly mark the new document as Added so SaveChanges generates an INSERT.
        _context.Documents.Add(doc);
        await _context.SaveChangesAsync(cancellationToken);

        var uploader = await _context.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == doc.UploadedByUserId, cancellationToken);

        return MapToDto(doc, uploader?.Name ?? "Ismeretlen");
    }

    internal static DocumentDto MapToDto(Document doc, string uploaderName) => new()
    {
        Id = doc.Id,
        WorkflowStepId = doc.WorkflowStepId,
        DocumentType = doc.DocumentType.ToString(),
        DisplayName = doc.DisplayName,
        FileName = doc.FileName,
        FileSizeBytes = doc.FileSizeBytes,
        ContentType = doc.ContentType,
        Version = doc.Version,
        IsArchived = doc.IsArchived,
        PreviousVersionId = doc.PreviousVersionId,
        UploadedByName = uploaderName,
        UploadedAt = doc.CreatedAt
    };
}
