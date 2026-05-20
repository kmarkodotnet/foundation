using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Domain.Entities;

public class BudgetPlan : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public string? Notes { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }

    private readonly List<BudgetItem> _items = [];
    public IReadOnlyList<BudgetItem> Items => _items.AsReadOnly();

    public decimal TotalPlanned => _items
        .Where(i => !i.IsDeleted)
        .Sum(i => i.PlannedAmount);

    private BudgetPlan() { }

    public static BudgetPlan Create(Guid applicationId)
    {
        return new BudgetPlan
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public BudgetItem AddItem(
        string name,
        BudgetItemType type,
        decimal plannedAmount,
        string? description,
        int sortOrder)
    {
        var item = BudgetItem.Create(Id, name, type, plannedAmount, description, sortOrder);
        _items.Add(item);
        UpdatedAt = DateTimeOffset.UtcNow;
        return item;
    }

    public void UpdateItem(Guid itemId, string name, BudgetItemType type, decimal plannedAmount, string? description, int sortOrder)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId && !i.IsDeleted)
            ?? throw new InvalidOperationException($"Budget item {itemId} not found.");
        item.Update(name, type, plannedAmount, description, sortOrder);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveItem(Guid itemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId && !i.IsDeleted)
            ?? throw new InvalidOperationException($"Budget item {itemId} not found.");
        item.Delete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Approve(Guid approvedByUserId)
    {
        ApprovedAt = DateTimeOffset.UtcNow;
        ApprovedByUserId = approvedByUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
