using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class ProofPhotoConfiguration : IEntityTypeConfiguration<ProofPhoto>
{
    public void Configure(EntityTypeBuilder<ProofPhoto> builder)
    {
        builder.ToTable("ProofPhotos");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.FileName).HasMaxLength(500).IsRequired();
        builder.Property(p => p.StoragePath).HasMaxLength(1000).IsRequired();
        builder.Property(p => p.ContentType).HasMaxLength(100).IsRequired();

        builder.HasIndex(p => p.ProofRecordId);
    }
}
