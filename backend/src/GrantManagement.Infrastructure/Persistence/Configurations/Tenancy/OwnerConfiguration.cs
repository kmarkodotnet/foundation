using GrantManagement.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations.Tenancy;

public class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> builder)
    {
        builder.ToTable("Owners");
        builder.HasKey(o => o.Id);
        builder.Ignore(o => o.DomainEvents);

        builder.Property(o => o.Name).IsRequired().HasMaxLength(200);
        builder.Property(o => o.ContactEmail).IsRequired().HasMaxLength(320);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(o => o.Status);
    }
}
