using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class WorkflowStepConfiguration : IEntityTypeConfiguration<WorkflowStep>
{
    public void Configure(EntityTypeBuilder<WorkflowStep> builder)
    {
        builder.ToTable("WorkflowSteps");
        builder.HasKey(ws => ws.Id);

        builder.Property(ws => ws.StepType).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(ws => ws.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(ws => ws.SkippedReason).HasColumnType("text");
        builder.Property(ws => ws.RejectionNote).HasColumnType("text");

        builder.HasIndex(ws => new { ws.ApplicationId, ws.StepType }).IsUnique();

        builder.HasMany(ws => ws.Documents)
            .WithOne()
            .HasForeignKey(d => d.WorkflowStepId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(ws => ws.Comments)
            .WithOne()
            .HasForeignKey(c => c.WorkflowStepId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(ws => ws.EmailAttachments)
            .WithOne()
            .HasForeignKey(ea => ea.WorkflowStepId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
