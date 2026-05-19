using AutoMapper;
using AutoMapper.QueryableExtensions;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Applications.Queries.GetApplicationList;

public class GetApplicationListQueryHandler
    : IRequestHandler<GetApplicationListQuery, PagedResult<ApplicationListItemDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetApplicationListQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResult<ApplicationListItemDto>> Handle(
        GetApplicationListQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Applications
            .AsNoTracking()
            .Where(a => !a.IsArchived);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(search) ||
                (a.Identifier != null && a.Identifier.ToLower().Contains(search)));
        }

        if (request.Statuses?.Length > 0)
            query = query.Where(a => request.Statuses.Contains(a.Status));

        if (request.GranterId.HasValue)
            query = query.Where(a => a.GranterId == request.GranterId.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<ApplicationListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return PagedResult<ApplicationListItemDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
