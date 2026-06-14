using GrantManagement.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations.Tenancy;

public class FoundationConfiguration : IEntityTypeConfiguration<Foundation>
{
    public void Configure(EntityTypeBuilder<Foundation> builder)
    {
        builder.ToTable("Foundations");
        builder.HasKey(f => f.Id);
        builder.Ignore(f => f.DomainEvents);

        builder.Property(f => f.Name).IsRequired().HasMaxLength(200);
        builder.Property(f => f.LogoUri).HasMaxLength(500);
        builder.Property(f => f.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(f => f.OwnerId);
        builder.HasIndex(f => new { f.OwnerId, f.Status });
    }
}
