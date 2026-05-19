using GrantManagement.Domain.Common;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public class BudgetPlan : BaseEntity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }

    private readonly List<BudgetItem> _items = [];
    public IReadOnlyList<BudgetItem> Items => _items.AsReadOnly();

    public Money TotalPlanned => _items
        .Where(i => !i.IsDeleted)
        .Aggregate(Money.Zero, (acc, i) => acc.Add(i.Amount));

    private BudgetPlan() { }

    public static BudgetPlan Create(Guid applicationId)
    {
        return new BudgetPlan
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public BudgetItem AddItem(string name, string? category, Money amount)
    {
        var order = _items.Count + 1;
        var item = BudgetItem.Create(Id, name, category, amount, order);
        _items.Add(item);
        UpdatedAt = DateTimeOffset.UtcNow;
        return item;
    }

    public void UpdateItem(Guid itemId, string name, string? category, Money amount)
    {
        var item = _items.First(i => i.Id == itemId);
        item.Update(name, category, amount);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveItem(Guid itemId)
    {
        var item = _items.First(i => i.Id == itemId);
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
