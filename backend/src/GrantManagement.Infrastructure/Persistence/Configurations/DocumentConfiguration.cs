using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.DocumentType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.FileName)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(d => d.DisplayName)
            .HasMaxLength(255);

        builder.Property(d => d.StoragePath)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(d => d.ContentType)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(d => d.WorkflowStepId);
        builder.HasIndex(d => d.PreviousVersionId);
    }
}
