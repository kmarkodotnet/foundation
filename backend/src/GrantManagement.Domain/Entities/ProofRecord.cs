using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class ProofRecord : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public string ProofType { get; private set; } = null!;
    public DateOnly EventDate { get; private set; }
    public string? Description { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public bool IsDeleted { get; private set; }

    private readonly List<ProofPhoto> _photos = [];
    public IReadOnlyList<ProofPhoto> Photos => _photos.AsReadOnly();

    private ProofRecord() { }

    public static ProofRecord Create(
        Guid applicationId,
        string proofType,
        DateOnly eventDate,
        Guid createdByUserId,
        string? description = null)
    {
        return new ProofRecord
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            ProofType = proofType,
            EventDate = eventDate,
            CreatedByUserId = createdByUserId,
            Description = description,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void AddPhoto(ProofPhoto photo) => _photos.Add(photo);
}
