using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Applications.Queries.GetApplicationList;

public class GetApplicationListQueryHandler
    : IRequestHandler<GetApplicationListQuery, PagedResult<ApplicationListItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetApplicationListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ApplicationListItemDto>> Handle(
        GetApplicationListQuery request,
        CancellationToken cancellationToken)
    {
        var apps = request.IncludeArchived
            ? _context.Applications.AsNoTracking().IgnoreQueryFilters()
            : _context.Applications.AsNoTracking();

        var query = apps.Join(
            _context.Granters.AsNoTracking(),
            a => a.GranterId,
            g => g.Id,
            (a, g) => new { App = a, GranterName = g.Name });

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(x =>
                x.App.Title.ToLower().Contains(term) ||
                (x.App.Identifier != null && x.App.Identifier.ToLower().Contains(term)));
        }

        if (request.GranterId.HasValue)
            query = query.Where(x => x.App.GranterId == request.GranterId.Value);

        if (request.ApplicationTypeId.HasValue)
            query = query.Where(x =>
                x.App.CallData != null &&
                x.App.CallData.ApplicationTypeId == request.ApplicationTypeId.Value);

        if (request.Statuses?.Length > 0)
            query = query.Where(x => request.Statuses.Contains(x.App.Status));

        if (request.SubmissionDeadlineFrom.HasValue)
        {
            var from = new DateTimeOffset(
                request.SubmissionDeadlineFrom.Value.ToDateTime(TimeOnly.MinValue),
                TimeSpan.Zero);
            query = query.Where(x =>
                x.App.CallData != null && x.App.CallData.SubmissionDeadline >= from);
        }

        if (request.SubmissionDeadlineTo.HasValue)
        {
            var to = new DateTimeOffset(
                request.SubmissionDeadlineTo.Value.ToDateTime(TimeOnly.MaxValue),
                TimeSpan.Zero);
            query = query.Where(x =>
                x.App.CallData != null && x.App.CallData.SubmissionDeadline <= to);
        }

        if (request.AwardedAmountMin.HasValue)
            query = query.Where(x =>
                x.App.Result != null &&
                x.App.Result.AwardedAmountValue >= request.AwardedAmountMin.Value);

        if (request.AwardedAmountMax.HasValue)
            query = query.Where(x =>
                x.App.Result != null &&
                x.App.Result.AwardedAmountValue <= request.AwardedAmountMax.Value);

        var sortedQuery = (request.SortBy, request.SortDirection) switch
        {
            (ApplicationSortBy.AwardedAmount, SortDirection.Desc) =>
                query.OrderByDescending(x => x.App.Result != null ? x.App.Result.AwardedAmountValue : null),
            (ApplicationSortBy.AwardedAmount, _) =>
                query.OrderBy(x => x.App.Result != null ? x.App.Result.AwardedAmountValue : null),
            (ApplicationSortBy.LastModified, SortDirection.Desc) =>
                query.OrderByDescending(x => x.App.UpdatedAt),
            (ApplicationSortBy.LastModified, _) =>
                query.OrderBy(x => x.App.UpdatedAt),
            (ApplicationSortBy.Status, SortDirection.Desc) =>
                query.OrderByDescending(x => x.App.Status),
            (ApplicationSortBy.Status, _) =>
                query.OrderBy(x => x.App.Status),
            (_, SortDirection.Desc) =>
                query.OrderByDescending(x => x.App.CallData != null ? x.App.CallData.SubmissionDeadline : default),
            _ =>
                query.OrderBy(x => x.App.CallData != null ? x.App.CallData.SubmissionDeadline : default)
        };

        var totalCount = await sortedQuery.CountAsync(cancellationToken);

        var items = await sortedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new ApplicationListItemDto
            {
                Id = x.App.Id,
                Title = x.App.Title,
                Identifier = x.App.Identifier,
                GranterName = x.GranterName,
                Status = x.App.Status,
                SubmissionDeadline = x.App.CallData != null
                    ? x.App.CallData.SubmissionDeadline
                    : default,
                SpendingDeadline = x.App.CallData != null
                    ? x.App.CallData.SpendingDeadline
                    : null,
                AwardedAmount = x.App.Result != null
                    ? x.App.Result.AwardedAmountValue
                    : null,
                LastModifiedAt = x.App.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<ApplicationListItemDto>.Create(
            items, totalCount, request.Page, request.PageSize);
    }
}
