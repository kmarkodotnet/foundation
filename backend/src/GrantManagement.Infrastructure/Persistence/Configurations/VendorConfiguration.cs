using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class VendorConfiguration : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.ToTable("Vendors");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Name).HasMaxLength(300).IsRequired();
        builder.Property(v => v.Address).HasMaxLength(500);
        builder.Property(v => v.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(v => v.Name).IsUnique();

        builder.OwnsOne(v => v.TaxNumber, tax =>
        {
            tax.Property(t => t.Value).HasColumnName("TaxNumber").HasMaxLength(20);
        });

        builder.OwnsOne(v => v.Contact, contact =>
        {
            contact.Property(c => c.PhoneNumber).HasColumnName("PhoneNumber").HasMaxLength(50);
            contact.Property(c => c.Email).HasColumnName("Email").HasMaxLength(300);
        });
    }
}
