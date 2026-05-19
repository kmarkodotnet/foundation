using GrantManagement.Domain.Common;
using GrantManagement.Domain.Exceptions;

namespace GrantManagement.Domain.Entities;

public enum CodeListItemStatus { Active, Inactive }

public class CodeList : AggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public bool IsSystem { get; private set; }

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
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public CodeListItem AddItem(string code, string name, string? description)
    {
        if (_items.Any(i => i.Code == code))
            throw new DomainException($"A '{code}' kód már létezik ebben a kódszótárban.");

        var order = _items.Count + 1;
        var item = CodeListItem.Create(Id, code, name, description, order);
        _items.Add(item);
        UpdatedAt = DateTimeOffset.UtcNow;
        return item;
    }

    public void UpdateItem(Guid itemId, string name, string? description)
    {
        var item = _items.First(i => i.Id == itemId);
        item.Update(name, description);
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

    public void Delete()
    {
        if (IsSystem)
            throw new DomainException("Rendszer kódszótár nem törölhető.");
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
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Update(string name, string? description)
    {
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
}
