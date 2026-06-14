using GrantManagement.Domain.Tenancy.Enums;
using MediatR;

namespace GrantManagement.Application.Platform.Users.Commands.InvitePlatformUser;

public record InvitePlatformUserCommand(string Email, PlatformRole Role) : IRequest<Unit>;
