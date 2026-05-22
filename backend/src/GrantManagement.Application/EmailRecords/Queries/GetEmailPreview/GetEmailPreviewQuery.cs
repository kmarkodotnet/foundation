using GrantManagement.Application.EmailRecords.DTOs;
using MediatR;

namespace GrantManagement.Application.EmailRecords.Queries.GetEmailPreview;

public record GetEmailPreviewQuery(Guid ApplicationId, Guid EmailRecordId)
    : IRequest<EmlPreviewDto>;
