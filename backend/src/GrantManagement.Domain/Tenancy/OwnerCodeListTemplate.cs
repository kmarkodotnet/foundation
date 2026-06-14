using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;

namespace GrantManagement.Domain.Tenancy;

public class OwnerCodeListTemplate : BaseEntity<Guid>
{
    public Guid OwnerId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Code { get; private set; } = null!;
    public bool IsActive { get; private set; }

    private readonly List<OwnerCodeListTemplateItem> _items = [];
    public IReadOnlyList<OwnerCodeListTemplateItem> Items => _items.AsReadOnly();

    private OwnerCodeListTemplate() { }

    public static OwnerCodeListTemplate Create(Guid ownerId, string name, string code)
    {
        return new OwnerCodeListTemplate
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = name.Trim(),
            Code = code.Trim(),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void AddItem(string value, string label, int order)
        => _items.Add(OwnerCodeListTemplateItem.Create(Id, value, label, order));

    public void UpdateItem(Guid itemId, string value, string label, int order)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId && !i.IsDeleted)
            ?? throw new DomainException("A tétel nem található.");
        item.Update(value, label, order);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveItem(Guid itemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId && !i.IsDeleted)
            ?? throw new DomainException("A tétel nem található.");
        item.SoftDelete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public class OwnerCodeListTemplateItem : BaseEntity<Guid>
{
    public Guid TemplateId { get; private set; }
    public string Value { get; private set; } = null!;
    public string Label { get; private set; } = null!;
    public int Order { get; private set; }
    public bool IsDeleted { get; private set; }

    private OwnerCodeListTemplateItem() { }

    internal static OwnerCodeListTemplateItem Create(Guid templateId, string value, string label, int order)
    {
        return new OwnerCodeListTemplateItem
        {
            Id = Guid.NewGuid(),
            TemplateId = templateId,
            Value = value,
            Label = label,
            Order = order,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Update(string value, string label, int order)
    {
        Value = value;
        Label = label;
        Order = order;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void SoftDelete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
