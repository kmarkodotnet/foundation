using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;

namespace GrantManagement.Domain.Entities;

public enum CodeListItemStatus { Active, Inactive }

public class CodeList : AggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public bool IsSystem { get; private set; }
    public bool IsDeleted { get; private set; }

    private readonly List<CodeListItem> _items = [];
    public IReadOnlyList<CodeListItem> Items => _items.AsReadOnly();

    private CodeList() { }

    public static CodeList Create(string name, string? description, bool isSystem = false)
    {
        return new CodeList
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            IsSystem = isSystem,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public CodeListItem AddItem(string code, string name, string? description)
    {
        if (_items.Any(i => i.Code == code && !i.IsDeleted))
            throw new DomainException($"A '{code}' kód már létezik ebben a kódszótárban.");

        var order = _items.Count(i => !i.IsDeleted) + 1;
        var item = CodeListItem.Create(Id, code, name, description, order);
        _items.Add(item);
        UpdatedAt = DateTimeOffset.UtcNow;
        return item;
    }

    public void UpdateItem(Guid itemId, string code, string name, string? description)
    {
        if (_items.Any(i => i.Code == code && i.Id != itemId && !i.IsDeleted))
            throw new DomainException($"A '{code}' kód már létezik ebben a kódszótárban.");

        var item = _items.First(i => i.Id == itemId);
        item.UpdateFull(code, name, description);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void DeactivateItem(Guid itemId)
    {
        var item = _items.First(i => i.Id == itemId);
        item.Deactivate();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ActivateItem(Guid itemId)
    {
        var item = _items.First(i => i.Id == itemId);
        item.Activate();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ReorderItems(IReadOnlyList<Guid> orderedIds)
    {
        for (var i = 0; i < orderedIds.Count; i++)
        {
            var item = _items.FirstOrDefault(x => x.Id == orderedIds[i]);
            item?.SetOrder(i + 1);
        }
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Delete()
    {
        if (IsSystem)
            throw new DomainException("Rendszer kódszótár nem törölhető.");

        IsDeleted = true;
        foreach (var item in _items)
            item.SoftDelete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public class CodeListItem : BaseEntity<Guid>
{
    public Guid CodeListId { get; private set; }
    public string Code { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public int Order { get; private set; }
    public CodeListItemStatus Status { get; private set; }
    public bool IsDeleted { get; private set; }

    private CodeListItem() { }

    internal static CodeListItem Create(
        Guid codeListId,
        string code,
        string name,
        string? description,
        int order)
    {
        return new CodeListItem
        {
            Id = Guid.NewGuid(),
            CodeListId = codeListId,
            Code = code,
            Name = name,
            Description = description,
            Order = order,
            Status = CodeListItemStatus.Active,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void UpdateFull(string code, string name, string? description)
    {
        Code = code;
        Name = name;
        Description = description;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Deactivate()
    {
        Status = CodeListItemStatus.Inactive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Activate()
    {
        Status = CodeListItemStatus.Active;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void SetOrder(int order)
    {
        Order = order;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void SoftDelete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
