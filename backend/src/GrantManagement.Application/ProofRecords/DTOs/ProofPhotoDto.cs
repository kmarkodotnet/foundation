namespace GrantManagement.Application.ProofRecords.DTOs;

public class ProofPhotoDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = null!;
    public string ContentType { get; init; } = null!;
    public long FileSizeBytes { get; init; }
}
