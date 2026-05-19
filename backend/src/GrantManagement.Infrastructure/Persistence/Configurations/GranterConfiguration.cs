using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class GranterConfiguration : IEntityTypeConfiguration<Granter>
{
    public void Configure(EntityTypeBuilder<Granter> builder)
    {
        builder.ToTable("Granters");
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name).HasMaxLength(300).IsRequired();
        builder.Property(g => g.Description).HasColumnType("text");
        builder.Property(g => g.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(g => g.RowVersion).IsRowVersion();

        builder.HasIndex(g => g.Name).IsUnique();

        builder.OwnsOne(g => g.Contact, contact =>
        {
            contact.Property(c => c.PhoneNumber).HasColumnName("PhoneNumber").HasMaxLength(50);
            contact.Property(c => c.Email).HasColumnName("Email").HasMaxLength(300);
        });
    }
}
