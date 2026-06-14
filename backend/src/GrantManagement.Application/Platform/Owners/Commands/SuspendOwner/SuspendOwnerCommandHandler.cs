using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Owners.Commands.SuspendOwner;

public sealed class SuspendOwnerCommandHandler : IRequestHandler<SuspendOwnerCommand, SuspendOwnerResponse>
{
    private readonly IApplicationDbContext _db;

    public SuspendOwnerCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<SuspendOwnerResponse> Handle(SuspendOwnerCommand request, CancellationToken cancellationToken)
    {
        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == request.OwnerId, cancellationToken)
            ?? throw new NotFoundException("Owner", request.OwnerId);

        owner.Suspend();
        await _db.SaveChangesAsync(cancellationToken);
        return new SuspendOwnerResponse(owner.Status.ToString());
    }
}
