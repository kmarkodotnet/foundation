using GrantManagement.Application.Documents.DTOs;
using MediatR;

namespace GrantManagement.Application.Documents.Queries.GetDocuments;

public record GetDocumentsQuery(
    Guid ApplicationId,
    Guid? WorkflowStepId,
    bool IncludeArchived = false) : IRequest<List<DocumentDto>>;
