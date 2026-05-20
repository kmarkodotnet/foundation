using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Granters.Commands.DeactivateGranter;

public class DeactivateGranterCommandHandler : IRequestHandler<DeactivateGranterCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeactivateGranterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(
        DeactivateGranterCommand request,
        CancellationToken cancellationToken)
    {
        var granter = await _context.Granters
            .FirstOrDefaultAsync(g => g.Id == request.GranterId, cancellationToken)
            ?? throw new NotFoundException(nameof(Granter), request.GranterId);

        granter.Deactivate();
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
