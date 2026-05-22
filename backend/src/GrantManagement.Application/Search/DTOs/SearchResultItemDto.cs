namespace GrantManagement.Application.Search.DTOs;

public record SearchResultItemDto(
    Guid Id,
    string DisplayName,
    string? Status,
    string EntityType
);
