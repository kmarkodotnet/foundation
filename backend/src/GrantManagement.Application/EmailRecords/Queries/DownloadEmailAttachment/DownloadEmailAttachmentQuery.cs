using MediatR;

namespace GrantManagement.Application.EmailRecords.Queries.DownloadEmailAttachment;

public record EmailAttachmentFileResult(Stream Stream, string ContentType, string FileName);

public record DownloadEmailAttachmentQuery(Guid ApplicationId, Guid EmailRecordId)
    : IRequest<EmailAttachmentFileResult>;
