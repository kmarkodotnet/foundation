namespace GrantManagement.Application.Invoices.DTOs;

public class InvoiceListDto
{
    public InvoiceSummaryDto Summary { get; init; } = null!;
    public List<InvoiceDto> Items { get; init; } = [];
}
