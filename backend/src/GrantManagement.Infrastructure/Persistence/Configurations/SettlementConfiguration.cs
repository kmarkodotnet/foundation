using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class SettlementConfiguration : IEntityTypeConfiguration<Settlement>
{
    public void Configure(EntityTypeBuilder<Settlement> builder)
    {
        builder.ToTable("Settlements");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.SettlementDate).IsRequired();
        builder.Property(s => s.Description).HasColumnType("text");
        builder.Property(s => s.Notes).HasColumnType("text");
    }
}
