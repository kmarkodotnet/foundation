using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class ProofRecordConfiguration : IEntityTypeConfiguration<ProofRecord>
{
    public void Configure(EntityTypeBuilder<ProofRecord> builder)
    {
        builder.ToTable("ProofRecords");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.ProofType).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(2000);

        builder.HasIndex(p => p.ApplicationId);

        builder.HasMany(p => p.Photos)
            .WithOne(ph => ph.ProofRecord)
            .HasForeignKey(ph => ph.ProofRecordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
