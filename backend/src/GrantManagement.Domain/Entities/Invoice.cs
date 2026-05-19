using GrantManagement.Domain.Common;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public class Invoice : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid? VendorId { get; private set; }
    public Guid? VendorContractId { get; private set; }
    public string InvoiceNumber { get; private set; } = null!;
    public decimal AmountValue { get; private set; }
    public string Currency { get; private set; } = "HUF";
    public Money Amount => new(AmountValue, Currency);
    public DateOnly InvoiceDate { get; private set; }
    public bool IsPaid { get; private set; }
    public DateOnly? PaidAt { get; private set; }
    public string? Notes { get; private set; }
    public Guid CreatedByUserId { get; private set; }

    private Invoice() { }

    public static Invoice Create(
        Guid applicationId,
        string invoiceNumber,
        Money amount,
        DateOnly invoiceDate,
        Guid createdByUserId,
        Guid? vendorId = null,
        Guid? vendorContractId = null,
        string? notes = null)
    {
        return new Invoice
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            InvoiceNumber = invoiceNumber,
            AmountValue = amount.Amount,
            Currency = amount.Currency,
            InvoiceDate = invoiceDate,
            IsPaid = false,
            CreatedByUserId = createdByUserId,
            VendorId = vendorId,
            VendorContractId = vendorContractId,
            Notes = notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string invoiceNumber,
        Money amount,
        DateOnly invoiceDate,
        Guid? vendorId,
        Guid? vendorContractId,
        string? notes)
    {
        InvoiceNumber = invoiceNumber;
        AmountValue = amount.Amount;
        Currency = amount.Currency;
        InvoiceDate = invoiceDate;
        VendorId = vendorId;
        VendorContractId = vendorContractId;
        Notes = notes;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkPaid(DateOnly paidAt)
    {
        IsPaid = true;
        PaidAt = paidAt;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
