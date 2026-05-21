using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class ProofPhoto : BaseEntity<Guid>
{
    public Guid ProofRecordId { get; private set; }
    public string FileName { get; private set; } = null!;
    public string StoragePath { get; private set; } = null!;
    public string ContentType { get; private set; } = null!;
    public long FileSizeBytes { get; private set; }

    public ProofRecord? ProofRecord { get; private set; }

    private ProofPhoto() { }

    public static ProofPhoto Create(
        Guid proofRecordId,
        string fileName,
        string storagePath,
        string contentType,
        long fileSizeBytes)
    {
        return new ProofPhoto
        {
            Id = Guid.NewGuid(),
            ProofRecordId = proofRecordId,
            FileName = fileName,
            StoragePath = storagePath,
            ContentType = contentType,
            FileSizeBytes = fileSizeBytes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
