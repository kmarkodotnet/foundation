using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.CodeLists.Queries.GetCodeListItems;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.CodeLists.Commands.UpdateCodeListItem;

public class UpdateCodeListItemCommandHandler : IRequestHandler<UpdateCodeListItemCommand, CodeListItemDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateCodeListItemCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CodeListItemDto> Handle(UpdateCodeListItemCommand request, CancellationToken cancellationToken)
    {
        var codeList = await _context.CodeLists
            .Include(cl => cl.Items)
            .FirstOrDefaultAsync(cl => cl.Id == request.CodeListId, cancellationToken)
            ?? throw new NotFoundException(nameof(CodeList), request.CodeListId);

        codeList.UpdateItem(request.ItemId, request.Code.Trim().ToUpper(), request.Name.Trim(), request.Description?.Trim());
        await _context.SaveChangesAsync(cancellationToken);

        var item = codeList.Items.First(i => i.Id == request.ItemId);
        return GetCodeListItemsQueryHandler.MapToDto(item);
    }
}
