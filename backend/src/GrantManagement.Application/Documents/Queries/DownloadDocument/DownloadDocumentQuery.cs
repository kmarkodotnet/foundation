using MediatR;

namespace GrantManagement.Application.Documents.Queries.DownloadDocument;

public record DownloadDocumentQuery(Guid ApplicationId, Guid DocumentId) : IRequest<DocumentFileResult>;
