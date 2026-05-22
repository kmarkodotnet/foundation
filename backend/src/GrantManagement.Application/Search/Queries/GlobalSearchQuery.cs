using GrantManagement.Application.Search.DTOs;
using MediatR;

namespace GrantManagement.Application.Search.Queries;

public record GlobalSearchQuery(string SearchTerm) : IRequest<GlobalSearchResultDto>;
