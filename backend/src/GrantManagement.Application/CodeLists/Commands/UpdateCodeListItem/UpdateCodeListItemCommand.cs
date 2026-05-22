using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.CodeLists.Commands.UpdateCodeListItem;

[RequireRole(UserRole.Admin)]
public record UpdateCodeListItemCommand(
    Guid CodeListId,
    Guid ItemId,
    string Code,
    string Name,
    string? Description
) : IRequest<CodeListItemDto>;
