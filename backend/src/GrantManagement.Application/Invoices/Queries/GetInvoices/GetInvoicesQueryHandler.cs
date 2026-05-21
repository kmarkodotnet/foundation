using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Invoices.Queries.GetInvoices;

public class GetInvoicesQueryHandler : IRequestHandler<GetInvoicesQuery, InvoiceListDto>
{
    private readonly IApplicationDbContext _context;

    public GetInvoicesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InvoiceListDto> Handle(GetInvoicesQuery request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .AsNoTracking()
            .Include(a => a.BudgetPlan)
            .ThenInclude(bp => bp!.Items)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var query = _context.Invoices
            .AsNoTracking()
            .Where(i => i.ApplicationId == request.ApplicationId);

        if (request.IsPaid.HasValue)
            query = query.Where(i => i.IsPaid == request.IsPaid.Value);

        if (request.DateFrom.HasValue)
            query = query.Where(i => i.IssueDate >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            query = query.Where(i => i.IssueDate <= request.DateTo.Value);

        query = (request.SortBy?.ToLowerInvariant(), request.SortDirection?.ToLowerInvariant()) switch
        {
            ("amount", "desc") => query.OrderByDescending(i => i.Amount),
            ("amount", _) => query.OrderBy(i => i.Amount),
            ("issuedate", "desc") => query.OrderByDescending(i => i.IssueDate),
            _ => query.OrderByDescending(i => i.IssueDate),
        };

        var invoices = await query.ToListAsync(cancellationToken);

        var awardedAmount = application.Result?.AwardedAmountValue;
        var totalPlanned = application.BudgetPlan?.TotalPlanned ?? 0m;
        var totalInvoiced = invoices.Sum(i => i.Amount);
        var totalPaid = invoices.Where(i => i.IsPaid).Sum(i => i.Amount);
        var totalUnpaid = totalInvoiced - totalPaid;
        var balance = awardedAmount.HasValue ? awardedAmount.Value - totalInvoiced : (decimal?)null;

        var summary = new InvoiceSummaryDto
        {
            AwardedAmount = awardedAmount,
            TotalPlanned = totalPlanned,
            TotalInvoiced = totalInvoiced,
            TotalPaid = totalPaid,
            TotalUnpaid = totalUnpaid,
            Balance = balance,
        };

        var items = invoices.Select(i => new InvoiceDto
        {
            Id = i.Id,
            ApplicationId = i.ApplicationId,
            SupplierName = i.SupplierName,
            InvoiceNumber = i.InvoiceNumber,
            IssueDate = i.IssueDate,
            Amount = i.Amount,
            IsPaid = i.IsPaid,
            PaymentDate = i.PaymentDate,
            VendorContractId = i.VendorContractId,
            BudgetItemId = i.BudgetItemId,
            Notes = i.Notes,
            CreatedByUserId = i.CreatedByUserId,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt,
        }).ToList();

        return new InvoiceListDto
        {
            Summary = summary,
            Items = items,
        };
    }
}
