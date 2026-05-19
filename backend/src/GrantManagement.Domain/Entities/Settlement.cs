using GrantManagement.Domain.Common;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public class Settlement : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public DateOnly SettlementDate { get; private set; }
    public Guid? SettlementMethodId { get; private set; }
    public string? Summary { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }
    public Guid CreatedByUserId { get; private set; }

    private Settlement() { }

    public static Settlement Create(
        Guid applicationId,
        SettlementParams p,
        Guid createdByUserId)
    {
        return new Settlement
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            SettlementDate = p.SettlementDate,
            SettlementMethodId = p.SettlementMethodId,
            Summary = p.Summary,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Approve(Guid approvedByUserId)
    {
        ApprovedAt = DateTimeOffset.UtcNow;
        ApprovedByUserId = approvedByUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Update(SettlementParams p)
    {
        SettlementDate = p.SettlementDate;
        SettlementMethodId = p.SettlementMethodId;
        Summary = p.Summary;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
