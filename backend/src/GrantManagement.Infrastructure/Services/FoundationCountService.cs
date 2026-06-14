using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Interfaces.Services;
using GrantManagement.Domain.Tenancy.Enums;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Infrastructure.Services;

public sealed class FoundationCountService : IFoundationCountService
{
    private readonly IApplicationDbContext _db;

    public FoundationCountService(IApplicationDbContext db) => _db = db;

    public async Task<int> GetActiveFoundationCountAsync(Guid ownerId, CancellationToken ct = default)
    {
        return await _db.Foundations
            .CountAsync(f => f.OwnerId == ownerId && f.Status == FoundationStatus.Active, ct);
    }
}
