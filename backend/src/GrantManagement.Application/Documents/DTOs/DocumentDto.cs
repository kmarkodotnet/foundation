namespace GrantManagement.Application.Documents.DTOs;

public class DocumentDto
{
    public Guid Id { get; init; }
    public Guid WorkflowStepId { get; init; }
    public string DocumentType { get; init; } = null!;
    public string? DisplayName { get; init; }
    public string FileName { get; init; } = null!;
    public long FileSizeBytes { get; init; }
    public string ContentType { get; init; } = null!;
    public int Version { get; init; }
    public bool IsArchived { get; init; }
    public Guid? PreviousVersionId { get; init; }
    public string UploadedByName { get; init; } = null!;
    public DateTimeOffset UploadedAt { get; init; }
}
