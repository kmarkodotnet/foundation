using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.ProofRecords.Commands.CreateProofRecord;

public class CreateProofRecordCommandHandler : IRequestHandler<CreateProofRecordCommand, ProofRecordDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;

    public CreateProofRecordCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IFileStorageService fileStorage)
    {
        _context = context;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
    }

    public async Task<ProofRecordDto> Handle(CreateProofRecordCommand request, CancellationToken cancellationToken)
    {
        // Verify application exists — do NOT use Include(a => a.ProofRecords) to avoid xmin concurrency issue
        var application = await _context.Applications
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (application.Status != ApplicationStatus.Won)
            throw new DomainException("Igazolás csak nyert pályázathoz rögzíthető.");

        // Create ProofRecord directly — bypassing Application aggregate to avoid xmin concurrency issue
        var record = ProofRecord.Create(
            request.ApplicationId,
            request.ProofType,
            request.EventDate,
            _currentUser.UserId,
            request.Notes);

        _context.ProofRecords.Add(record);

        // Upload photos and create ProofPhoto entries
        var photoDtos = new List<ProofPhotoDto>();
        foreach (var photo in request.Photos)
        {
            var storagePath = await _fileStorage.SaveFileAsync(
                photo.Stream,
                photo.FileName,
                photo.ContentType,
                cancellationToken);

            var proofPhoto = ProofPhoto.Create(
                record.Id,
                photo.FileName,
                storagePath,
                photo.ContentType,
                photo.Length);

            _context.ProofPhotos.Add(proofPhoto);

            photoDtos.Add(new ProofPhotoDto
            {
                Id = proofPhoto.Id,
                FileName = proofPhoto.FileName,
                ContentType = proofPhoto.ContentType,
                FileSizeBytes = proofPhoto.FileSizeBytes
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ProofRecordDto
        {
            Id = record.Id,
            ApplicationId = record.ApplicationId,
            ProofType = record.ProofType,
            EventDate = record.EventDate,
            Description = record.Description,
            CreatedByUserId = record.CreatedByUserId,
            CreatedAt = record.CreatedAt,
            Photos = photoDtos
        };
    }
}
