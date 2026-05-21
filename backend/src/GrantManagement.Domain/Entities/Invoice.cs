using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class Invoice : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public string SupplierName { get; private set; } = null!;
    public string InvoiceNumber { get; private set; } = null!;
    public DateOnly IssueDate { get; private set; }
    public decimal Amount { get; private set; }
    public bool IsPaid { get; private set; }
    public DateOnly? PaymentDate { get; private set; }
    public Guid? VendorContractId { get; private set; }
    public Guid? BudgetItemId { get; private set; }
    public string? Notes { get; private set; }
    public bool IsDeleted { get; private set; }
    public Guid CreatedByUserId { get; private set; }

    // Navigation property
    public Application? Application { get; private set; }

    private Invoice() { }

    public static Invoice Create(
        Guid applicationId,
        string supplierName,
        string invoiceNumber,
        DateOnly issueDate,
        decimal amount,
        bool isPaid,
        DateOnly? paymentDate,
        Guid createdByUserId,
        Guid? vendorContractId = null,
        Guid? budgetItemId = null,
        string? notes = null)
    {
        return new Invoice
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            SupplierName = supplierName,
            InvoiceNumber = invoiceNumber,
            IssueDate = issueDate,
            Amount = amount,
            IsPaid = isPaid,
            PaymentDate = paymentDate,
            CreatedByUserId = createdByUserId,
            VendorContractId = vendorContractId,
            BudgetItemId = budgetItemId,
            Notes = notes,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string supplierName,
        string invoiceNumber,
        DateOnly issueDate,
        decimal amount,
        bool isPaid,
        DateOnly? paymentDate,
        Guid? vendorContractId,
        Guid? budgetItemId,
        string? notes)
    {
        SupplierName = supplierName;
        InvoiceNumber = invoiceNumber;
        IssueDate = issueDate;
        Amount = amount;
        IsPaid = isPaid;
        PaymentDate = paymentDate;
        VendorContractId = vendorContractId;
        BudgetItemId = budgetItemId;
        Notes = notes;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkPaid(DateOnly paymentDate)
    {
        IsPaid = true;
        PaymentDate = paymentDate;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
