using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.Commands.UploadDocument;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Documents.Commands.UploadDocumentVersion;

public class UploadDocumentVersionCommandHandler : IRequestHandler<UploadDocumentVersionCommand, DocumentDto>
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

    public UploadDocumentVersionCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IFileStorageService fileStorage)
    {
        _context = context;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentDto> Handle(UploadDocumentVersionCommand request, CancellationToken cancellationToken)
    {
        // Load the parent document (active only — respects !IsArchived global filter)
        var parent = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId &&
                _context.WorkflowSteps.Any(ws =>
                    ws.ApplicationId == request.ApplicationId && ws.Id == d.WorkflowStepId),
                cancellationToken)
            ?? throw new NotFoundException("Document", request.DocumentId);

        if (!AllowedMimeTypes.Contains(request.File.ContentType))
            throw new DomainException("Ez a fájlformátum nem támogatott.");

        if (request.File.Length > MaxFileSizeBytes)
            throw new DomainException("A fájl mérete meghaladja a 50 MB-os korlátot.");

        // Archive the current version
        parent.Archive();

        // Save new file
        var storagePath = await _fileStorage.SaveFileAsync(
            request.File.Stream,
            request.File.FileName,
            request.File.ContentType,
            cancellationToken);

        // Create new document version directly — bypassing Application aggregate to avoid xmin issues
        var newDoc = Document.Create(
            parent.WorkflowStepId,
            parent.DocumentType,
            request.File.FileName,
            storagePath,
            request.File.Length,
            request.File.ContentType,
            _currentUser.UserId,
            version: parent.Version + 1,
            previousVersionId: parent.Id,
            displayName: request.DisplayName ?? parent.DisplayName);

        _context.Documents.Add(newDoc);
        await _context.SaveChangesAsync(cancellationToken);

        var uploader = await _context.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == newDoc.UploadedByUserId, cancellationToken);

        return UploadDocumentCommandHandler.MapToDto(newDoc, uploader?.Name ?? "Ismeretlen");
    }
}
