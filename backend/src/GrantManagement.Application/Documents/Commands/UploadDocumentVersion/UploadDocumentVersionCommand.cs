using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Documents.Commands.UploadDocumentVersion;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record UploadDocumentVersionCommand : IRequest<DocumentDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public Guid DocumentId { get; init; }
    public string? DisplayName { get; init; }
    public DocumentUpload File { get; init; } = null!;
}
