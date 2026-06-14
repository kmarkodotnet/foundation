using GrantManagement.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class FoundationUserAssignmentConfiguration : IEntityTypeConfiguration<FoundationUserAssignment>
{
    public void Configure(EntityTypeBuilder<FoundationUserAssignment> builder)
    {
        builder.ToTable("FoundationUserAssignments");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.FoundationRole).HasConversion<string>().HasMaxLength(30);

        builder.HasIndex(a => new { a.AppUserId, a.FoundationId })
            .HasFilter("\"IsActive\" = true")
            .IsUnique();
        builder.HasIndex(a => a.FoundationId);
    }
}
