using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class BudgetItemConfiguration : IEntityTypeConfiguration<BudgetItem>
{
    public void Configure(EntityTypeBuilder<BudgetItem> builder)
    {
        builder.ToTable("BudgetItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Name).HasMaxLength(300).IsRequired();
        builder.Property(i => i.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(i => i.Description).HasColumnType("text");
        builder.Property(i => i.PlannedAmount).HasColumnType("decimal(18,2)").IsRequired();

        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}
