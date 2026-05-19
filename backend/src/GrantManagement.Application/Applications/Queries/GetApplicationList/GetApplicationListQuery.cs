using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Models;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Applications.Queries.GetApplicationList;

public record GetApplicationListQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    ApplicationStatus[]? Statuses = null,
    Guid? GranterId = null,
    DateTimeOffset? DeadlineFrom = null,
    DateTimeOffset? DeadlineTo = null,
    string? SortBy = null,
    string? SortDir = null
) : IRequest<PagedResult<ApplicationListItemDto>>;
