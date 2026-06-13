using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.ToTable("Invitations");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Email).HasMaxLength(300).IsRequired();
        builder.Property(i => i.Role).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(i => i.Token).HasMaxLength(64).IsRequired();
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(i => i.ExpiresAt).IsRequired();

        builder.HasIndex(i => i.Token).IsUnique();
        builder.HasIndex(i => new { i.Email, i.Status });
    }
}
