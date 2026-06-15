namespace GrantManagement.Domain.Common;

public abstract class BaseEntity<TId>
{
    public TId Id { get; protected set; } = default!;
    public DateTimeOffset CreatedAt { get; protected set; }
    public DateTimeOffset UpdatedAt { get; protected set; }

    public void SetCreatedAt(DateTimeOffset now) { CreatedAt = now; UpdatedAt = now; }
    public void Touch(DateTimeOffset now) => UpdatedAt = now;
}
