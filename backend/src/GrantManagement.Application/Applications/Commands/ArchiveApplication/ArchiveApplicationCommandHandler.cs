using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Applications.Commands.ArchiveApplication;

public class ArchiveApplicationCommandHandler : IRequestHandler<ArchiveApplicationCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public ArchiveApplicationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(
        ArchiveApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        application.Archive();

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
