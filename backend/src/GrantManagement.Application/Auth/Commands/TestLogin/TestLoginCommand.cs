using GrantManagement.Application.Auth.DTOs;
using MediatR;

namespace GrantManagement.Application.Auth.Commands.TestLogin;

/// <summary>
/// Issues a real JWT for a test user without Google OAuth.
/// Only usable in Development / Testing environments — enforced at the controller level.
/// </summary>
public sealed record TestLoginCommand(
    string Role,
    string Email,
    string Name) : IRequest<AuthResultDto>;
