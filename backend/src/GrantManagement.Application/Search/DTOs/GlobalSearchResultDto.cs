namespace GrantManagement.Application.Search.DTOs;

public record GlobalSearchResultDto(
    IReadOnlyList<SearchResultItemDto> Applications,
    IReadOnlyList<SearchResultItemDto> Granters,
    IReadOnlyList<SearchResultItemDto> Vendors
);
