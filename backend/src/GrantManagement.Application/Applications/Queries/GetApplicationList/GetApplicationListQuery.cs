using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Models;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Applications.Queries.GetApplicationList;

public enum ApplicationSortBy
{
    SubmissionDeadline,
    AwardedAmount,
    LastModified,
    Status
}

public enum SortDirection { Asc, Desc }

public record GetApplicationListQuery(
    int Page = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    Guid? GranterId = null,
    Guid? ApplicationTypeId = null,
    ApplicationStatus[]? Statuses = null,
    DateOnly? SubmissionDeadlineFrom = null,
    DateOnly? SubmissionDeadlineTo = null,
    decimal? AwardedAmountMin = null,
    decimal? AwardedAmountMax = null,
    bool IncludeArchived = false,
    ApplicationSortBy SortBy = ApplicationSortBy.SubmissionDeadline,
    SortDirection SortDirection = SortDirection.Asc
) : IRequest<PagedResult<ApplicationListItemDto>>;
