using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Search.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Search.Queries;

public class GlobalSearchQueryHandler : IRequestHandler<GlobalSearchQuery, GlobalSearchResultDto>
{
    private const int MaxResultsPerGroup = 5;

    private readonly IApplicationDbContext _context;

    public GlobalSearchQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GlobalSearchResultDto> Handle(
        GlobalSearchQuery request,
        CancellationToken cancellationToken)
    {
        var term = request.SearchTerm.ToLower();

        var applications = await _context.Applications
            .AsNoTracking()
            .Where(a =>
                a.Title.ToLower().Contains(term) ||
                (a.Identifier != null && a.Identifier.ToLower().Contains(term)))
            .OrderBy(a => a.Title)
            .Take(MaxResultsPerGroup)
            .Select(a => new SearchResultItemDto(
                a.Id,
                a.Title,
                a.Status.ToString(),
                "Application"))
            .ToListAsync(cancellationToken);

        var granters = await _context.Granters
            .AsNoTracking()
            .Where(g => g.Name.ToLower().Contains(term))
            .OrderBy(g => g.Name)
            .Take(MaxResultsPerGroup)
            .Select(g => new SearchResultItemDto(
                g.Id,
                g.Name,
                g.Status.ToString(),
                "Granter"))
            .ToListAsync(cancellationToken);

        var vendors = await _context.Vendors
            .AsNoTracking()
            .Where(v => v.Name.ToLower().Contains(term))
            .OrderBy(v => v.Name)
            .Take(MaxResultsPerGroup)
            .Select(v => new SearchResultItemDto(
                v.Id,
                v.Name,
                v.Status.ToString(),
                "Vendor"))
            .ToListAsync(cancellationToken);

        return new GlobalSearchResultDto(applications, granters, vendors);
    }
}
