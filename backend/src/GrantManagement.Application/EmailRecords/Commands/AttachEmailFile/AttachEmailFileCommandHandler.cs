using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;
using GrantManagement.Application.EmailRecords.DTOs;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.EmailRecords.Commands.AttachEmailFile;

public class AttachEmailFileCommandHandler : IRequestHandler<AttachEmailFileCommand, EmailRecordDto>
{
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "message/rfc822",
        "application/vnd.ms-outlook"
    };

    private const long MaxFileSizeBytes = 50L * 1024 * 1024;

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;
    private readonly IEmailParser _emailParser;

    public AttachEmailFileCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IFileStorageService fileStorage,
        IEmailParser emailParser)
    {
        _context = context;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
        _emailParser = emailParser;
    }

    public async Task<EmailRecordDto> Handle(
        AttachEmailFileCommand request,
        CancellationToken cancellationToken)
    {
        var record = await _context.EmailRecords
            .FirstOrDefaultAsync(e => e.Id == request.EmailRecordId
                && e.ApplicationId == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("EmailRecord", request.EmailRecordId);

        var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        var isEml = ext == ".eml" || request.File.ContentType.Equals("message/rfc822", StringComparison.OrdinalIgnoreCase);
        var isMsg = ext == ".msg" || request.File.ContentType.Equals("application/vnd.ms-outlook", StringComparison.OrdinalIgnoreCase);

        if (!isEml && !isMsg)
            throw new DomainException("Csak .eml vagy .msg fájl csatolható.");

        if (request.File.Length > MaxFileSizeBytes)
            throw new DomainException("A fájl mérete meghaladja az 50 MB-os korlátot.");

        using var ms = new MemoryStream();
        await request.File.Stream.CopyToAsync(ms, cancellationToken);
        ms.Position = 0;

        var storagePath = await _fileStorage.SaveFileAsync(
            ms,
            request.File.FileName,
            request.File.ContentType,
            cancellationToken);

        record.AttachFile(storagePath, request.File.FileName, request.File.ContentType);

        if (isEml)
        {
            ms.Position = 0;
            var preview = _emailParser.Parse(ms);
            if (preview != null)
                record.SetEmlPreview(preview.From, preview.Subject, preview.Date, preview.Body);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var creator = await _context.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == record.CreatedByUserId, cancellationToken);

        return CreateEmailRecordCommandHandler.MapToDto(record, creator?.Name ?? "Ismeretlen");
    }
}
