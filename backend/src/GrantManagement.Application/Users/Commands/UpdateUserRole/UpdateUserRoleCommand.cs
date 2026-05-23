using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Users.Commands.UpdateUserRole;

public record UpdateUserRoleCommand(Guid UserId, UserRole NewRole) : IRequest<Unit>;
