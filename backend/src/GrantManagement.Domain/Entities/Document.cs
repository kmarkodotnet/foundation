using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Domain.Entities;

public class Document : BaseEntity<Guid>
{
    public Guid WorkflowStepId { get; private set; }
    public DocumentType DocumentType { get; private set; }
    public string FileName { get; private set; } = null!;
    public string StoragePath { get; private set; } = null!;
    public long FileSizeBytes { get; private set; }
    public string ContentType { get; private set; } = null!;
    public int Version { get; private set; }
    public bool IsArchived { get; private set; }
    public Guid? PreviousVersionId { get; private set; }
    public Guid UploadedByUserId { get; private set; }
    public string? DisplayName { get; private set; }

    private Document() { }

    public static Document Create(
        Guid workflowStepId,
        DocumentType documentType,
        string fileName,
        string storagePath,
        long fileSizeBytes,
        string contentType,
        Guid uploadedByUserId,
        int version = 1,
        Guid? previousVersionId = null,
        string? displayName = null)
    {
        return new Document
        {
            Id = Guid.NewGuid(),
            WorkflowStepId = workflowStepId,
            DocumentType = documentType,
            FileName = fileName,
            StoragePath = storagePath,
            FileSizeBytes = fileSizeBytes,
            ContentType = contentType,
            UploadedByUserId = uploadedByUserId,
            Version = version,
            PreviousVersionId = previousVersionId,
            IsArchived = false,
            DisplayName = displayName,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Archive()
    {
        IsArchived = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
