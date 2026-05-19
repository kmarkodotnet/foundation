using GrantManagement.Domain.Common;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public class BudgetItem : BaseEntity<Guid>
{
    public Guid BudgetPlanId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Category { get; private set; }
    public decimal AmountValue { get; private set; }
    public string Currency { get; private set; } = "HUF";
    public int Order { get; private set; }
    public bool IsDeleted { get; private set; }

    public Money Amount => new(AmountValue, Currency);

    private BudgetItem() { }

    internal static BudgetItem Create(
        Guid budgetPlanId,
        string name,
        string? category,
        Money amount,
        int order)
    {
        return new BudgetItem
        {
            Id = Guid.NewGuid(),
            BudgetPlanId = budgetPlanId,
            Name = name,
            Category = category,
            AmountValue = amount.Amount,
            Currency = amount.Currency,
            Order = order,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Update(string name, string? category, Money amount)
    {
        Name = name;
        Category = category;
        AmountValue = amount.Amount;
        Currency = amount.Currency;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Delete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
