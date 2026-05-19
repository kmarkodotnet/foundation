using GrantManagement.Application.Auth.DTOs;
using MediatR;

namespace GrantManagement.Application.Auth.Commands.GoogleLogin;

public sealed record GoogleLoginCommand(
    string AuthorizationCode,
    string RedirectUri) : IRequest<AuthResultDto>;
