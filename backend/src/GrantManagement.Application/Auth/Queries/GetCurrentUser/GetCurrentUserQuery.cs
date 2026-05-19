using GrantManagement.Application.Auth.DTOs;
using MediatR;

namespace GrantManagement.Application.Auth.Queries.GetCurrentUser;

public sealed record GetCurrentUserQuery : IRequest<UserProfileDto>;
