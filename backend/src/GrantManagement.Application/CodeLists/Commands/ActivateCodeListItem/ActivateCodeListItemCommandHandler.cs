using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.CodeLists.Commands.ActivateCodeListItem;

public class ActivateCodeListItemCommandHandler : IRequestHandler<ActivateCodeListItemCommand>
{
    private readonly IApplicationDbContext _context;

    public ActivateCodeListItemCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(ActivateCodeListItemCommand request, CancellationToken cancellationToken)
    {
        var codeList = await _context.CodeLists
            .Include(cl => cl.Items)
            .FirstOrDefaultAsync(cl => cl.Id == request.CodeListId, cancellationToken)
            ?? throw new NotFoundException(nameof(CodeList), request.CodeListId);

        codeList.ActivateItem(request.ItemId);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
