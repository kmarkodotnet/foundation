using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.CodeLists.Commands.ReorderCodeListItems;

public class ReorderCodeListItemsCommandHandler : IRequestHandler<ReorderCodeListItemsCommand>
{
    private readonly IApplicationDbContext _context;

    public ReorderCodeListItemsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(ReorderCodeListItemsCommand request, CancellationToken cancellationToken)
    {
        var codeList = await _context.CodeLists
            .Include(cl => cl.Items)
            .FirstOrDefaultAsync(cl => cl.Id == request.CodeListId, cancellationToken)
            ?? throw new NotFoundException(nameof(CodeList), request.CodeListId);

        codeList.ReorderItems(request.OrderedItemIds);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
