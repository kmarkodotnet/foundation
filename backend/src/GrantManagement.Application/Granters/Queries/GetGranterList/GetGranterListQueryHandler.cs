using AutoMapper;
using AutoMapper.QueryableExtensions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Granters.Queries.GetGranterList;

public class GetGranterListQueryHandler
    : IRequestHandler<GetGranterListQuery, IReadOnlyList<GranterDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetGranterListQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<GranterDto>> Handle(
        GetGranterListQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Granters.AsNoTracking();

        if (request.ActiveOnly)
            query = query.Where(g => g.Status == GranterStatus.Active);

        return await query
            .OrderBy(g => g.Name)
            .ProjectTo<GranterDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
