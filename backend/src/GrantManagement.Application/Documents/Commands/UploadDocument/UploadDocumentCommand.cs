using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Documents.Commands.UploadDocument;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record UploadDocumentCommand : IRequest<DocumentDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public Guid? WorkflowStepId { get; init; }
    public DocumentType DocumentType { get; init; }
    public string? DisplayName { get; init; }
    public DocumentUpload File { get; init; } = null!;
}
