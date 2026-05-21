using System.IO.Compression;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.DTOs;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.ProofRecords.Queries.DownloadAllProofPhotos;

public class DownloadAllProofPhotosQueryHandler : IRequestHandler<DownloadAllProofPhotosQuery, ProofPhotoFileResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public DownloadAllProofPhotosQueryHandler(
        IApplicationDbContext context,
        IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<ProofPhotoFileResult> Handle(DownloadAllProofPhotosQuery request, CancellationToken cancellationToken)
    {
        var record = await _context.ProofRecords
            .AsNoTracking()
            .Include(r => r.Photos)
            .FirstOrDefaultAsync(r =>
                r.Id == request.ProofRecordId &&
                r.ApplicationId == request.ApplicationId,
                cancellationToken)
            ?? throw new NotFoundException("ProofRecord", request.ProofRecordId);

        var zipStream = new MemoryStream();
        using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var photo in record.Photos)
            {
                var entry = archive.CreateEntry(photo.FileName, CompressionLevel.Fastest);
                using var entryStream = entry.Open();
                var fileStream = await _fileStorage.GetFileAsync(photo.StoragePath, cancellationToken);
                await fileStream.CopyToAsync(entryStream, cancellationToken);
                await fileStream.DisposeAsync();
            }
        }

        zipStream.Position = 0;

        return new ProofPhotoFileResult(
            zipStream,
            "application/zip",
            $"proof-photos-{request.ProofRecordId}.zip");
    }
}
