using GrantManagement.Application.Users.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Users.Queries.GetUserList;

public record GetUserListQuery(
    string? SearchTerm = null,
    UserRole? Role = null) : IRequest<IReadOnlyList<UserListItemDto>>;
