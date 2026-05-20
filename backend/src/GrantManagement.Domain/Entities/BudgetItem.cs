using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Domain.Entities;

public class BudgetItem : BaseEntity<Guid>
{
    public Guid BudgetPlanId { get; private set; }
    public string Name { get; private set; } = null!;
    public BudgetItemType Type { get; private set; }
    public string? Description { get; private set; }
    public decimal PlannedAmount { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsDeleted { get; private set; }

    private BudgetItem() { }

    internal static BudgetItem Create(
        Guid budgetPlanId,
        string name,
        BudgetItemType type,
        decimal plannedAmount,
        string? description,
        int sortOrder)
    {
        return new BudgetItem
        {
            Id = Guid.NewGuid(),
            BudgetPlanId = budgetPlanId,
            Name = name,
            Type = type,
            PlannedAmount = plannedAmount,
            Description = description,
            SortOrder = sortOrder,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    internal void Update(string name, BudgetItemType type, decimal plannedAmount, string? description, int sortOrder)
    {
        Name = name;
        Type = type;
        PlannedAmount = plannedAmount;
        Description = description;
        SortOrder = sortOrder;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Delete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
