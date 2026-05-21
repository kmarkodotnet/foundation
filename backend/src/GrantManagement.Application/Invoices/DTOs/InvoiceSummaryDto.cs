namespace GrantManagement.Application.Invoices.DTOs;

public class InvoiceSummaryDto
{
    public decimal? AwardedAmount { get; init; }
    public decimal TotalPlanned { get; init; }
    public decimal TotalInvoiced { get; init; }
    public decimal TotalPaid { get; init; }
    public decimal TotalUnpaid { get; init; }
    public decimal? Balance { get; init; }
}
