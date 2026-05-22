using ClosedXML.Excel;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Applications.Queries.ExportApplications;

public class ExportApplicationsQueryHandler : IRequestHandler<ExportApplicationsQuery, ExportResult>
{
    private readonly IApplicationDbContext _context;

    public ExportApplicationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ExportResult> Handle(
        ExportApplicationsQuery request,
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

        var rows = await query
            .OrderBy(x => x.App.CallData != null ? x.App.CallData.SubmissionDeadline : default)
            .Select(x => new
            {
                x.App.Identifier,
                x.App.Title,
                x.GranterName,
                x.App.Status,
                SubmissionDeadline = x.App.CallData != null ? (DateTimeOffset?)x.App.CallData.SubmissionDeadline : null,
                SpendingDeadline = x.App.CallData != null ? x.App.CallData.SpendingDeadline : null,
                AwardedAmount = x.App.Result != null ? x.App.Result.AwardedAmountValue : null,
                x.App.CreatedAt,
                x.App.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Pályázatok");

        ws.Cell(1, 1).Value = "Azonosító";
        ws.Cell(1, 2).Value = "Cím";
        ws.Cell(1, 3).Value = "Pályáztató";
        ws.Cell(1, 4).Value = "Típus";
        ws.Cell(1, 5).Value = "Állapot";
        ws.Cell(1, 6).Value = "Beadási határidő";
        ws.Cell(1, 7).Value = "Elnyert összeg (HUF)";
        ws.Cell(1, 8).Value = "Elköltési határidő";
        ws.Cell(1, 9).Value = "Létrehozva";
        ws.Cell(1, 10).Value = "Módosítva";

        var headerRow = ws.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

        for (var i = 0; i < rows.Count; i++)
        {
            var r = rows[i];
            var row = i + 2;

            ws.Cell(row, 1).Value = r.Identifier ?? string.Empty;
            ws.Cell(row, 2).Value = r.Title;
            ws.Cell(row, 3).Value = r.GranterName;
            ws.Cell(row, 4).Value = string.Empty;
            ws.Cell(row, 5).Value = r.Status.ToString();
            ws.Cell(row, 6).Value = r.SubmissionDeadline.HasValue
                ? r.SubmissionDeadline.Value.ToString("yyyy-MM-dd")
                : string.Empty;
            ws.Cell(row, 7).Value = r.AwardedAmount.HasValue ? (double)r.AwardedAmount.Value : 0;
            ws.Cell(row, 8).Value = r.SpendingDeadline.HasValue
                ? r.SpendingDeadline.Value.ToString("yyyy-MM-dd")
                : string.Empty;
            ws.Cell(row, 9).Value = r.CreatedAt.ToString("yyyy-MM-dd");
            ws.Cell(row, 10).Value = r.UpdatedAt.ToString("yyyy-MM-dd");
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);

        var fileName = $"palyazatok_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return new ExportResult(ms.ToArray(), fileName);
    }
}
