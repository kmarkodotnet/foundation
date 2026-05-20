using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class ApplicationConfiguration : IEntityTypeConfiguration<GrantApp>
{
    public void Configure(EntityTypeBuilder<GrantApp> builder)
    {
        builder.ToTable("Applications");
        builder.HasKey(a => a.Id);
        builder.Ignore(a => a.DomainEvents);

        builder.Property(a => a.Title).HasMaxLength(500).IsRequired();
        builder.Property(a => a.Identifier).HasMaxLength(100);
        builder.Property(a => a.Description).HasColumnType("text");

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property<uint>("xmin").HasColumnType("xid").IsRowVersion();

        builder.OwnsOne(a => a.CallData, callData =>
        {
            callData.Property(c => c.SubmissionDeadline).HasColumnName("SubmissionDeadline");
            callData.Property(c => c.SpendingDeadline).HasColumnName("SpendingDeadline");
            callData.Property(c => c.Description).HasColumnName("CallDescription").HasColumnType("text");
            callData.Property(c => c.OtherMetadata).HasColumnName("OtherMetadata").HasColumnType("text");
            callData.Property(c => c.ApplicationTypeId).HasColumnName("ApplicationTypeId");

            callData.Property(c => c.MinAmountValue).HasColumnName("MinAmount").HasColumnType("decimal(18,2)");
            callData.Property(c => c.MinAmountCurrency).HasColumnName("MinCurrency").HasMaxLength(3);
            callData.Property(c => c.MaxAmountValue).HasColumnName("MaxAmount").HasColumnType("decimal(18,2)");
            callData.Property(c => c.MaxAmountCurrency).HasColumnName("MaxCurrency").HasMaxLength(3);
            callData.Ignore(c => c.MinAmount);
            callData.Ignore(c => c.MaxAmount);
        });

        builder.OwnsOne(a => a.SubmissionData, sub =>
        {
            sub.Property(s => s.SubmittedAt).HasColumnName("SubmittedAt");
            sub.Property(s => s.SubmittedByUserId).HasColumnName("SubmittedByUserId");
            sub.Property(s => s.SubmissionMethodId).HasColumnName("SubmissionMethodId");
            sub.Property(s => s.ExternalIdentifier).HasColumnName("SubmissionExternalIdentifier").HasMaxLength(200);
            sub.Property(s => s.Description).HasColumnName("SubmissionDescription").HasColumnType("text");
        });

        builder.OwnsOne(a => a.Result, result =>
        {
            result.Property(r => r.Outcome).HasColumnName("ResultOutcome").HasConversion<string>().HasMaxLength(20);
            result.Property(r => r.ResultDate).HasColumnName("ResultDate");
            result.Property(r => r.ResultIdentifier).HasColumnName("ResultIdentifier").HasMaxLength(100);

            result.Property(r => r.AwardedAmountValue).HasColumnName("AwardedAmount").HasColumnType("decimal(18,2)");
            result.Property(r => r.AwardedAmountCurrency).HasColumnName("AwardedCurrency").HasMaxLength(3);
            result.Ignore(r => r.AwardedAmount);
        });

        builder.OwnsOne(a => a.GranterContractData, gc =>
        {
            gc.Property(g => g.ContractIdentifier).HasColumnName("GranterContractIdentifier").HasMaxLength(100);
            gc.Property(g => g.ContractDate).HasColumnName("GranterContractDate");
            gc.Property(g => g.NotificationReceived).HasColumnName("GranterNotificationReceived");
            gc.Property(g => g.NotificationDate).HasColumnName("GranterNotificationDate");
        });

        builder.HasMany(a => a.WorkflowSteps)
            .WithOne()
            .HasForeignKey(ws => ws.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.BudgetPlan)
            .WithOne()
            .HasForeignKey<Domain.Entities.BudgetPlan>(bp => bp.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(a => a.VendorContracts)
            .WithOne()
            .HasForeignKey(vc => vc.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(a => a.Invoices)
            .WithOne()
            .HasForeignKey(i => i.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(a => a.ProofRecords)
            .WithOne()
            .HasForeignKey(p => p.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Settlement)
            .WithOne()
            .HasForeignKey<Domain.Entities.Settlement>(s => s.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
