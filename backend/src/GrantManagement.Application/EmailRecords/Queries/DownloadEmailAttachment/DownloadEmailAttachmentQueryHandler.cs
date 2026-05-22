using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.EmailRecords.Queries.DownloadEmailAttachment;

public class DownloadEmailAttachmentQueryHandler
    : IRequestHandler<DownloadEmailAttachmentQuery, EmailAttachmentFileResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public DownloadEmailAttachmentQueryHandler(
        IApplicationDbContext context,
        IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<EmailAttachmentFileResult> Handle(
        DownloadEmailAttachmentQuery request,
        CancellationToken cancellationToken)
    {
        var record = await _context.EmailRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.EmailRecordId
                && e.ApplicationId == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("EmailRecord", request.EmailRecordId);

        if (record.AttachmentStoragePath == null)
            throw new NotFoundException("Attachment", request.EmailRecordId);

        var stream = await _fileStorage.GetFileAsync(record.AttachmentStoragePath, cancellationToken);
        var contentType = record.AttachmentContentType ?? "application/octet-stream";
        var fileName = record.AttachmentFileName ?? "email-attachment";

        return new EmailAttachmentFileResult(stream, contentType, fileName);
    }
}
