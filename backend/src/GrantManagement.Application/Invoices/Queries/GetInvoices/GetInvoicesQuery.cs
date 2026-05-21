using GrantManagement.Application.Invoices.DTOs;
using MediatR;

namespace GrantManagement.Application.Invoices.Queries.GetInvoices;

public record GetInvoicesQuery(
    Guid ApplicationId,
    bool? IsPaid = null,
    DateOnly? DateFrom = null,
    DateOnly? DateTo = null,
    string? SortBy = null,
    string? SortDirection = null
) : IRequest<InvoiceListDto>;
