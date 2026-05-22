using GrantManagement.Application.CodeLists.DTOs;
using MediatR;

namespace GrantManagement.Application.CodeLists.Queries.GetCodeListItems;

public record GetCodeListItemsQuery(Guid CodeListId, bool IncludeInactive) : IRequest<List<CodeListItemDto>>;
