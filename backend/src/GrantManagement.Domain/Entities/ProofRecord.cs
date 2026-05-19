using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class ProofRecord : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public string ProofType { get; private set; } = null!;
    public DateOnly EventDate { get; private set; }
    public string? Description { get; private set; }
    public Guid CreatedByUserId { get; private set; }

    private readonly List<Document> _photos = [];
    public IReadOnlyList<Document> Photos => _photos.AsReadOnly();

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
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void AddPhoto(Document photo) => _photos.Add(photo);
}
