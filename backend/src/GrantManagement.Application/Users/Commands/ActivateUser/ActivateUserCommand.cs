using MediatR;

namespace GrantManagement.Application.Users.Commands.ActivateUser;

public record ActivateUserCommand(Guid UserId) : IRequest<Unit>;
