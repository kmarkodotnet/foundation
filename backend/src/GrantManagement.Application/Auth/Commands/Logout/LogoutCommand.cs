using MediatR;

namespace GrantManagement.Application.Auth.Commands.Logout;

public sealed record LogoutCommand : IRequest<Unit>;
