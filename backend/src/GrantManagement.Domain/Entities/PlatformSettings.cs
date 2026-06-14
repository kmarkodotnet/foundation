using GrantManagement.Domain.Common;

namespace GrantManagement.Domain.Entities;

public class PlatformSettings : BaseEntity<Guid>
{
    public static readonly Guid SingletonId = new("00000000-0000-0000-0000-000000000001");

    public int MaxFileSizeMb { get; private set; }
    public int InvitationExpiryHours { get; private set; }
    public int DefaultDeadlineNotificationDays { get; private set; }
    public Guid? DefaultOwnerCodeListTemplateId { get; private set; }

    private PlatformSettings() { }

    public static PlatformSettings CreateDefault()
    {
        return new PlatformSettings
        {
            Id = SingletonId,
            MaxFileSizeMb = 50,
            InvitationExpiryHours = 72,
            DefaultDeadlineNotificationDays = 7,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        int? maxFileSizeMb,
        int? invitationExpiryHours,
        int? defaultDeadlineNotificationDays,
        Guid? defaultOwnerCodeListTemplateId)
    {
        if (maxFileSizeMb.HasValue) MaxFileSizeMb = maxFileSizeMb.Value;
        if (invitationExpiryHours.HasValue) InvitationExpiryHours = invitationExpiryHours.Value;
        if (defaultDeadlineNotificationDays.HasValue) DefaultDeadlineNotificationDays = defaultDeadlineNotificationDays.Value;
        if (defaultOwnerCodeListTemplateId.HasValue) DefaultOwnerCodeListTemplateId = defaultOwnerCodeListTemplateId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
