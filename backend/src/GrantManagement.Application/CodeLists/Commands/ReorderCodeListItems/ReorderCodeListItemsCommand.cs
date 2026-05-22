using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.CodeLists.Commands.ReorderCodeListItems;

[RequireRole(UserRole.Admin)]
public record ReorderCodeListItemsCommand(Guid CodeListId, IReadOnlyList<Guid> OrderedItemIds) : IRequest;
