using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class BudgetPlanConfiguration : IEntityTypeConfiguration<BudgetPlan>
{
    public void Configure(EntityTypeBuilder<BudgetPlan> builder)
    {
        builder.ToTable("BudgetPlans");
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Notes).HasColumnType("text");

        builder.HasMany(b => b.Items)
            .WithOne()
            .HasForeignKey(i => i.BudgetPlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
