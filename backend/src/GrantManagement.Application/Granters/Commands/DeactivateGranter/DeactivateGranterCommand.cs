using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Granters.Commands.DeactivateGranter;

[RequireRole(UserRole.Admin)]
public record DeactivateGranterCommand(Guid GranterId) : IRequest<Unit>;
