using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Applications.Commands.ArchiveApplication;

[RequireRole(UserRole.Admin)]
public record ArchiveApplicationCommand(Guid ApplicationId) : IRequest<Unit>;
