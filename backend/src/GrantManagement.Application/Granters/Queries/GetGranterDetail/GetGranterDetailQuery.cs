using GrantManagement.Application.Granters.DTOs;
using MediatR;

namespace GrantManagement.Application.Granters.Queries.GetGranterDetail;

public record GetGranterDetailQuery(Guid GranterId) : IRequest<GranterDetailDto>;
