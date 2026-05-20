using GrantManagement.Application.Granters.DTOs;
using MediatR;

namespace GrantManagement.Application.Granters.Queries.GetGranterList;

public record GetGranterListQuery(bool ActiveOnly = false) : IRequest<IReadOnlyList<GranterDto>>;
