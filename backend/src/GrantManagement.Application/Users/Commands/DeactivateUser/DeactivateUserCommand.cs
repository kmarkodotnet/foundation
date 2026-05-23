using MediatR;

namespace GrantManagement.Application.Users.Commands.DeactivateUser;

public record DeactivateUserCommand(Guid UserId) : IRequest<Unit>;
