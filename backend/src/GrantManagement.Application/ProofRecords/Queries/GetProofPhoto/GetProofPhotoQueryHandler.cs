using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.DTOs;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.ProofRecords.Queries.GetProofPhoto;

public class GetProofPhotoQueryHandler : IRequestHandler<GetProofPhotoQuery, ProofPhotoFileResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public GetProofPhotoQueryHandler(
        IApplicationDbContext context,
        IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<ProofPhotoFileResult> Handle(GetProofPhotoQuery request, CancellationToken cancellationToken)
    {
        var photo = await _context.ProofPhotos
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.Id == request.PhotoId &&
                p.ProofRecordId == request.ProofRecordId,
                cancellationToken)
            ?? throw new NotFoundException("ProofPhoto", request.PhotoId);

        // Verify the record belongs to the given application
        var recordExists = await _context.ProofRecords
            .AsNoTracking()
            .AnyAsync(r =>
                r.Id == request.ProofRecordId &&
                r.ApplicationId == request.ApplicationId,
                cancellationToken);

        if (!recordExists)
            throw new NotFoundException("ProofRecord", request.ProofRecordId);

        var stream = await _fileStorage.GetFileAsync(photo.StoragePath, cancellationToken);

        return new ProofPhotoFileResult(stream, photo.ContentType, photo.FileName);
    }
}
