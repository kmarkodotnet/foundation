using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.CodeLists.Commands.CreateCodeListItem;

[RequireRole(UserRole.Admin)]
public record CreateCodeListItemCommand(
    Guid CodeListId,
    string Code,
    string Name,
    string? Description
) : IRequest<CodeListItemDto>;
