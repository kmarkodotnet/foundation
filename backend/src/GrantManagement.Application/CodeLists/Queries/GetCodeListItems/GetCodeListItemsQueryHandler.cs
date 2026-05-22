using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.CodeLists.Queries.GetCodeListItems;

public class GetCodeListItemsQueryHandler : IRequestHandler<GetCodeListItemsQuery, List<CodeListItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCodeListItemsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CodeListItemDto>> Handle(GetCodeListItemsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.CodeListItems
            .AsNoTracking()
            .Where(i => i.CodeListId == request.CodeListId);

        if (!request.IncludeInactive)
            query = query.Where(i => i.Status == CodeListItemStatus.Active);

        var items = await query
            .OrderBy(i => i.Order)
            .ToListAsync(cancellationToken);

        return items.Select(MapToDto).ToList();
    }

    internal static CodeListItemDto MapToDto(CodeListItem i) => new()
    {
        Id = i.Id,
        CodeListId = i.CodeListId,
        Code = i.Code,
        Name = i.Name,
        Description = i.Description,
        Order = i.Order,
        Status = i.Status.ToString(),
    };
}
