using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Infrastructure.Services;

public class ActiveApplicationCountService : IActiveApplicationCountService
{
    private readonly IApplicationDbContext _db;

    public ActiveApplicationCountService(IApplicationDbContext db) => _db = db;

    public Task<int> GetActiveApplicationCountAsync(Guid foundationId, CancellationToken ct = default)
        => _db.Applications.CountAsync(a => a.FoundationId == foundationId, ct);
}
