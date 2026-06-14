namespace GrantManagement.Domain.Interfaces.Services;

public interface IFoundationCountService
{
    Task<int> GetActiveFoundationCountAsync(Guid ownerId, CancellationToken ct = default);
}

public interface IOwnerAdminCountService
{
    Task<int> GetOwnerAdminCountAsync(Guid ownerId, CancellationToken ct = default);
}

public interface IActiveApplicationCountService
{
    Task<int> GetActiveApplicationCountAsync(Guid foundationId, CancellationToken ct = default);
}
