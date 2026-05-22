namespace GrantManagement.Application.CodeLists.DTOs;

public class CodeListItemDto
{
    public Guid Id { get; init; }
    public Guid CodeListId { get; init; }
    public string Code { get; init; } = null!;
    public string Name { get; init; } = null!;
    public string? Description { get; init; }
    public int Order { get; init; }
    public string Status { get; init; } = null!;
}
