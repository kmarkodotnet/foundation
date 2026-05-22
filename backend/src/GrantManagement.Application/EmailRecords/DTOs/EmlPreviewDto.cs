namespace GrantManagement.Application.EmailRecords.DTOs;

public record EmlPreviewDto
{
    public string? From { get; init; }
    public string? Subject { get; init; }
    public DateTimeOffset? Date { get; init; }
    public string? Body { get; init; }
}
