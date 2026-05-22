using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.CodeLists.Commands.ActivateCodeListItem;

[RequireRole(UserRole.Admin)]
public record ActivateCodeListItemCommand(Guid CodeListId, Guid ItemId) : IRequest;
