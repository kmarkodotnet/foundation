using GrantManagement.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations.Tenancy;

public class BreakGlassGrantConfiguration : IEntityTypeConfiguration<BreakGlassGrant>
{
    public void Configure(EntityTypeBuilder<BreakGlassGrant> builder)
    {
        builder.ToTable("BreakGlassGrants");
        builder.HasKey(g => g.Id);
        builder.Ignore(g => g.DomainEvents);

        builder.Property(g => g.Reason).IsRequired().HasMaxLength(2000);
        builder.Property(g => g.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(g => new { g.Status, g.ExpiresAt });
        builder.HasIndex(g => g.TargetOwnerId);
    }
}
