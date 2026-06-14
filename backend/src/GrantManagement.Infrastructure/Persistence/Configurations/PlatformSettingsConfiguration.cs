using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class PlatformSettingsConfiguration : IEntityTypeConfiguration<PlatformSettings>
{
    public void Configure(EntityTypeBuilder<PlatformSettings> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.MaxFileSizeMb).IsRequired();
        builder.Property(s => s.InvitationExpiryHours).IsRequired();
        builder.Property(s => s.DefaultDeadlineNotificationDays).IsRequired();
        builder.HasData(new
        {
            Id = PlatformSettings.SingletonId,
            MaxFileSizeMb = 50,
            InvitationExpiryHours = 72,
            DefaultDeadlineNotificationDays = 7,
            DefaultOwnerCodeListTemplateId = (Guid?)null,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
    }
}
