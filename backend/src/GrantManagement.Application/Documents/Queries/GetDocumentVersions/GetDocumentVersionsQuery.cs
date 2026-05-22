using GrantManagement.Application.Documents.DTOs;
using MediatR;

namespace GrantManagement.Application.Documents.Queries.GetDocumentVersions;

public record GetDocumentVersionsQuery(Guid ApplicationId, Guid DocumentId) : IRequest<List<DocumentVersionDto>>;
