using GrantManagement.Domain.Common;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public class VendorContract : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid VendorId { get; private set; }
    public string? ContractIdentifier { get; private set; }
    public DateOnly? ContractDate { get; private set; }
    public decimal AmountValue { get; private set; }
    public string Currency { get; private set; } = "HUF";
    public Money Amount => new(AmountValue, Currency);
    public Guid? BudgetItemId { get; private set; }
    public string? Notes { get; private set; }
    public Guid CreatedByUserId { get; private set; }

    private VendorContract() { }

    public static VendorContract Create(
        Guid applicationId,
        Guid vendorId,
        Money amount,
        Guid createdByUserId,
        string? contractIdentifier = null,
        DateOnly? contractDate = null,
        Guid? budgetItemId = null,
        string? notes = null)
    {
        return new VendorContract
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            VendorId = vendorId,
            AmountValue = amount.Amount,
            Currency = amount.Currency,
            CreatedByUserId = createdByUserId,
            ContractIdentifier = contractIdentifier,
            ContractDate = contractDate,
            BudgetItemId = budgetItemId,
            Notes = notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        Guid vendorId,
        Money amount,
        string? contractIdentifier,
        DateOnly? contractDate,
        Guid? budgetItemId,
        string? notes)
    {
        VendorId = vendorId;
        AmountValue = amount.Amount;
        Currency = amount.Currency;
        ContractIdentifier = contractIdentifier;
        ContractDate = contractDate;
        BudgetItemId = budgetItemId;
        Notes = notes;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
