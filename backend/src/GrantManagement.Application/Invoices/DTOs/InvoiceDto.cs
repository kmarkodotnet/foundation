namespace GrantManagement.Application.Invoices.DTOs;

public class InvoiceDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string SupplierName { get; init; } = null!;
    public string InvoiceNumber { get; init; } = null!;
    public DateOnly IssueDate { get; init; }
    public decimal Amount { get; init; }
    public bool IsPaid { get; init; }
    public DateOnly? PaymentDate { get; init; }
    public Guid? VendorContractId { get; init; }
    public Guid? BudgetItemId { get; init; }
    public string? Notes { get; init; }
    public Guid CreatedByUserId { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
