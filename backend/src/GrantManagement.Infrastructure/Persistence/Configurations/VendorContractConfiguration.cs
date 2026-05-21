using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class VendorContractConfiguration : IEntityTypeConfiguration<VendorContract>
{
    public void Configure(EntityTypeBuilder<VendorContract> builder)
    {
        builder.ToTable("VendorContracts");
        builder.HasKey(vc => vc.Id);

        builder.Property(vc => vc.ContractIdentifier).HasMaxLength(100);
        builder.Property(vc => vc.AmountValue).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(vc => vc.Currency).HasMaxLength(3).IsRequired();
        builder.Property(vc => vc.Notes).HasColumnType("text");

        builder.Ignore(vc => vc.Amount);
    }
}
