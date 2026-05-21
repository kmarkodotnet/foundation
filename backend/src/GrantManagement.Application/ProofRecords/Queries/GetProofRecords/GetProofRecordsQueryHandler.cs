using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.ProofRecords.Queries.GetProofRecords;

public class GetProofRecordsQueryHandler : IRequestHandler<GetProofRecordsQuery, List<ProofRecordDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProofRecordsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProofRecordDto>> Handle(GetProofRecordsQuery request, CancellationToken cancellationToken)
    {
        var exists = await _context.Applications
            .AsNoTracking()
            .AnyAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (!exists)
            throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var records = await _context.ProofRecords
            .AsNoTracking()
            .Include(r => r.Photos)
            .Where(r => r.ApplicationId == request.ApplicationId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return records.Select(r => new ProofRecordDto
        {
            Id = r.Id,
            ApplicationId = r.ApplicationId,
            ProofType = r.ProofType,
            EventDate = r.EventDate,
            Description = r.Description,
            CreatedByUserId = r.CreatedByUserId,
            CreatedAt = r.CreatedAt,
            Photos = r.Photos.Select(p => new ProofPhotoDto
            {
                Id = p.Id,
                FileName = p.FileName,
                ContentType = p.ContentType,
                FileSizeBytes = p.FileSizeBytes
            }).ToList()
        }).ToList();
    }
}
