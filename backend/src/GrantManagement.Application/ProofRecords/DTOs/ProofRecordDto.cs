namespace GrantManagement.Application.ProofRecords.DTOs;

public class ProofRecordDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string ProofType { get; init; } = null!;
    public DateOnly EventDate { get; init; }
    public string? Description { get; init; }
    public Guid CreatedByUserId { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public List<ProofPhotoDto> Photos { get; init; } = [];
}
