using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Owners.Commands.ReactivateOwner;

public sealed class ReactivateOwnerCommandHandler : IRequestHandler<ReactivateOwnerCommand, ReactivateOwnerResponse>
{
    private readonly IApplicationDbContext _db;

    public ReactivateOwnerCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ReactivateOwnerResponse> Handle(ReactivateOwnerCommand request, CancellationToken cancellationToken)
    {
        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == request.OwnerId, cancellationToken)
            ?? throw new NotFoundException("Owner", request.OwnerId);

        owner.Reactivate();
        await _db.SaveChangesAsync(cancellationToken);
        return new ReactivateOwnerResponse(owner.Status.ToString());
    }
}
