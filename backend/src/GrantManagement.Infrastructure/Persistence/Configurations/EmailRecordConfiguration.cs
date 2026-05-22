using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class EmailRecordConfiguration : IEntityTypeConfiguration<EmailRecord>
{
    public void Configure(EntityTypeBuilder<EmailRecord> builder)
    {
        builder.ToTable("EmailRecords");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Subject).HasMaxLength(1000).IsRequired();
        builder.Property(e => e.SenderEmail).HasMaxLength(500).IsRequired();
        builder.Property(e => e.ContentSummary).HasMaxLength(4000);
        builder.Property(e => e.Direction)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.AttachmentStoragePath).HasMaxLength(1000);
        builder.Property(e => e.AttachmentFileName).HasMaxLength(500);
        builder.Property(e => e.AttachmentContentType).HasMaxLength(200);

        builder.Property(e => e.EmlFrom).HasMaxLength(1000);
        builder.Property(e => e.EmlSubject).HasMaxLength(1000);
        builder.Property(e => e.EmlBody).HasColumnType("text");

        builder.HasIndex(e => e.ApplicationId);
        builder.HasIndex(e => e.WorkflowStepId);
    }
}
