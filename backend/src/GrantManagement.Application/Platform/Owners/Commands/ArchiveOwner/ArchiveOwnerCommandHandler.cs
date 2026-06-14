using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Owners.Commands.ArchiveOwner;

public sealed class ArchiveOwnerCommandHandler : IRequestHandler<ArchiveOwnerCommand, ArchiveOwnerResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly IFoundationCountService _foundationCountService;

    public ArchiveOwnerCommandHandler(IApplicationDbContext db, IFoundationCountService foundationCountService)
    {
        _db = db;
        _foundationCountService = foundationCountService;
    }

    public async Task<ArchiveOwnerResponse> Handle(ArchiveOwnerCommand request, CancellationToken cancellationToken)
    {
        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == request.OwnerId, cancellationToken)
            ?? throw new NotFoundException("Owner", request.OwnerId);

        var activeFoundationCount = await _foundationCountService.GetActiveFoundationCountAsync(request.OwnerId, cancellationToken);
        if (activeFoundationCount > 0)
            throw new DomainException("Először minden alapítványt archiválj.");

        owner.Archive();
        await _db.SaveChangesAsync(cancellationToken);
        return new ArchiveOwnerResponse(owner.Status.ToString());
    }
}
