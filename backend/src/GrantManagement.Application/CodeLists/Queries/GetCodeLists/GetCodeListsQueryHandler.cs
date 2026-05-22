using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.CodeLists.Queries.GetCodeLists;

public class GetCodeListsQueryHandler : IRequestHandler<GetCodeListsQuery, List<CodeListDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCodeListsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CodeListDto>> Handle(GetCodeListsQuery request, CancellationToken cancellationToken)
    {
        var lists = await _context.CodeLists
            .AsNoTracking()
            .OrderBy(cl => cl.Name)
            .ToListAsync(cancellationToken);

        var itemCounts = await _context.CodeListItems
            .AsNoTracking()
            .GroupBy(i => i.CodeListId)
            .Select(g => new { CodeListId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CodeListId, x => x.Count, cancellationToken);

        return lists.Select(cl => new CodeListDto
        {
            Id = cl.Id,
            Name = cl.Name,
            Description = cl.Description,
            IsSystem = cl.IsSystem,
            ItemCount = itemCounts.GetValueOrDefault(cl.Id, 0),
            CreatedAt = cl.CreatedAt,
            UpdatedAt = cl.UpdatedAt,
        }).ToList();
    }
}
