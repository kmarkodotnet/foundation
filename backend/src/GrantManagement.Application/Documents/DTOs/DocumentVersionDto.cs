namespace GrantManagement.Application.Documents.DTOs;

public class DocumentVersionDto
{
    public Guid Id { get; init; }
    public int Version { get; init; }
    public string FileName { get; init; } = null!;
    public string? DisplayName { get; init; }
    public DateTimeOffset UploadedAt { get; init; }
    public string UploadedByName { get; init; } = null!;
    public bool IsArchived { get; init; }
}
