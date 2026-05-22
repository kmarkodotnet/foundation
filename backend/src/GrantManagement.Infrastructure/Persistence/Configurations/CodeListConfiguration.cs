using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class CodeListConfiguration : IEntityTypeConfiguration<CodeList>
{
    private static readonly Guid DocumentTypeId = new("11111111-0000-0000-0000-000000000001");
    private static readonly Guid SubmissionMethodId = new("11111111-0000-0000-0000-000000000002");
    private static readonly Guid SettlementMethodId = new("11111111-0000-0000-0000-000000000003");
    private static readonly Guid ApplicationTypeId = new("11111111-0000-0000-0000-000000000004");

    private static readonly DateTimeOffset SeedDate = new(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);

    public void Configure(EntityTypeBuilder<CodeList> builder)
    {
        builder.ToTable("CodeLists");
        builder.HasKey(cl => cl.Id);

        builder.Property(cl => cl.Name).HasMaxLength(200).IsRequired();
        builder.Property(cl => cl.Description).HasColumnType("text");
        builder.Property(cl => cl.IsSystem).IsRequired();
        builder.Property(cl => cl.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasIndex(cl => cl.Name).IsUnique().HasFilter("\"IsDeleted\" = false");

        builder.HasMany(cl => cl.Items)
            .WithOne()
            .HasForeignKey(i => i.CodeListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasData(
            new { Id = DocumentTypeId, Name = "Dokumentum típusa", Description = (string?)null, IsSystem = true, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = SubmissionMethodId, Name = "Beadási mód", Description = (string?)null, IsSystem = true, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = SettlementMethodId, Name = "Elszámolási mód", Description = (string?)null, IsSystem = true, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = ApplicationTypeId, Name = "Pályázat típusa", Description = (string?)null, IsSystem = true, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate }
        );
    }
}
