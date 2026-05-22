using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.EmailRecords.Queries.GetEmailPreview;

public class GetEmailPreviewQueryHandler : IRequestHandler<GetEmailPreviewQuery, EmlPreviewDto>
{
    private readonly IApplicationDbContext _context;

    public GetEmailPreviewQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<EmlPreviewDto> Handle(
        GetEmailPreviewQuery request,
        CancellationToken cancellationToken)
    {
        var record = await _context.EmailRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.EmailRecordId
                && e.ApplicationId == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("EmailRecord", request.EmailRecordId);

        if (record.AttachmentStoragePath == null)
            throw new NotFoundException("Attachment", request.EmailRecordId);

        return new EmlPreviewDto
        {
            From = record.EmlFrom,
            Subject = record.EmlSubject,
            Date = record.EmlDate,
            Body = record.EmlBody
        };
    }
}
