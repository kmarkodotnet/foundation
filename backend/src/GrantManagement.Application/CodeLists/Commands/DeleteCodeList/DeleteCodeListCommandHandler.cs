using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.CodeLists.Commands.DeleteCodeList;

public class DeleteCodeListCommandHandler : IRequestHandler<DeleteCodeListCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteCodeListCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteCodeListCommand request, CancellationToken cancellationToken)
    {
        var codeList = await _context.CodeLists
            .Include(cl => cl.Items)
            .FirstOrDefaultAsync(cl => cl.Id == request.CodeListId, cancellationToken)
            ?? throw new NotFoundException(nameof(CodeList), request.CodeListId);

        if (codeList.IsSystem)
            throw new DomainException("Rendszer kódszótár nem törölhető.");

        if (codeList.Items.Count > 0)
            throw new DomainException("A kódszótár nem törölhető, mert aktív elemeket tartalmaz.");

        codeList.Delete();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
