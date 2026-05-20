using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Granters.Commands.CreateGranter;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record CreateGranterCommand(
    string Name,
    string? Description,
    string? PhoneNumber,
    string? Email
) : IRequest<GranterDto>;
