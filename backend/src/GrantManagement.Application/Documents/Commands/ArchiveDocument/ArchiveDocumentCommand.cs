using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Documents.Commands.ArchiveDocument;

[RequireRole(UserRole.Admin)]
public record ArchiveDocumentCommand(Guid ApplicationId, Guid DocumentId) : IRequest<Unit>, IApplicationCommand;
