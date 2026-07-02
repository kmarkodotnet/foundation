using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Owners.Queries.GetOwnerDetails;

public sealed class GetOwnerDetailsQueryHandler : IRequestHandler<GetOwnerDetailsQuery, OwnerDetailsResponse>
{
    private readonly IApplicationDbContext _db;

    public GetOwnerDetailsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<OwnerDetailsResponse> Handle(GetOwnerDetailsQuery request, CancellationToken cancellationToken)
    {
        var owner = await _db.Owners
            .AsNoTracking()
            .Where(o => o.Id == request.OwnerId)
            .Select(o => new OwnerDetailsResponse(
                o.Id,
                o.Name,
                o.ContactEmail,
                o.Status.ToString(),
                _db.Foundations.Count(f => f.OwnerId == o.Id && f.Status != FoundationStatus.Archived),
                o.CreatedAt,
                o.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return owner ?? throw new NotFoundException("Owner", request.OwnerId);
    }
}
