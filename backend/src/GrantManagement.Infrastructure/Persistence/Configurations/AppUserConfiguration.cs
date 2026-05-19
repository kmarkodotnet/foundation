using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("AppUsers");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.GoogleId).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(300).IsRequired();
        builder.Property(u => u.Name).HasMaxLength(300).IsRequired();
        builder.Property(u => u.ProfilePictureUrl).HasMaxLength(1000);
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(u => u.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(u => u.GoogleId).IsUnique();
        builder.HasIndex(u => u.Email).IsUnique();

        builder.OwnsOne(u => u.NotificationPrefs, prefs =>
        {
            prefs.Property(p => p.EmailOnDeadlineApproaching).HasColumnName("NotifDeadlineApproaching");
            prefs.Property(p => p.EmailOnDeadlineMissed).HasColumnName("NotifDeadlineMissed");
            prefs.Property(p => p.EmailOnResultRecorded).HasColumnName("NotifResultRecorded");
            prefs.Property(p => p.EmailOnApprovalRequired).HasColumnName("NotifApprovalRequired");
            prefs.Property(p => p.EmailOnNewComment).HasColumnName("NotifNewComment");
            prefs.Property(p => p.EmailOnDocumentUploaded).HasColumnName("NotifDocumentUploaded");
        });
    }
}
