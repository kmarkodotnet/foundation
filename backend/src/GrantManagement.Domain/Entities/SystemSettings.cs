using GrantManagement.Domain.Enums;

namespace GrantManagement.Domain.Entities;

public class SystemSettings
{
    public int Id { get; private set; }
    public int NotificationWarningDays { get; private set; }
    public int SpendingWarningDays { get; private set; }
    public int MaxFileSizeMb { get; private set; }
    public string OrganizationName { get; private set; } = null!;
    public UserRole DefaultUserRole { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private SystemSettings() { }

    public static SystemSettings CreateDefault() => new()
    {
        Id = 1,
        NotificationWarningDays = 7,
        SpendingWarningDays = 14,
        MaxFileSizeMb = 50,
        OrganizationName = "Alapítvány",
        DefaultUserRole = UserRole.Megtekinto,
        UpdatedAt = DateTimeOffset.UtcNow
    };

    public void Update(
        int notificationWarningDays,
        int spendingWarningDays,
        int maxFileSizeMb,
        string organizationName,
        UserRole defaultUserRole)
    {
        NotificationWarningDays = notificationWarningDays;
        SpendingWarningDays = spendingWarningDays;
        MaxFileSizeMb = maxFileSizeMb;
        OrganizationName = organizationName.Trim();
        DefaultUserRole = defaultUserRole;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
