using GrantManagement.Application.CodeLists.DTOs;
using MediatR;

namespace GrantManagement.Application.CodeLists.Queries.GetCodeLists;

public record GetCodeListsQuery : IRequest<List<CodeListDto>>;
