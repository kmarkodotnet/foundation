using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.CodeLists.Commands.DeactivateCodeListItem;

[RequireRole(UserRole.Admin)]
public record DeactivateCodeListItemCommand(Guid CodeListId, Guid ItemId) : IRequest;
