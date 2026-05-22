using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations;

public class CodeListItemConfiguration : IEntityTypeConfiguration<CodeListItem>
{
    private static readonly Guid DocumentTypeId = new("11111111-0000-0000-0000-000000000001");
    private static readonly Guid SubmissionMethodId = new("11111111-0000-0000-0000-000000000002");
    private static readonly Guid SettlementMethodId = new("11111111-0000-0000-0000-000000000003");
    private static readonly Guid ApplicationTypeId = new("11111111-0000-0000-0000-000000000004");

    private static readonly DateTimeOffset SeedDate = new(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);

    public void Configure(EntityTypeBuilder<CodeListItem> builder)
    {
        builder.ToTable("CodeListItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Code).HasMaxLength(100).IsRequired();
        builder.Property(i => i.Name).HasMaxLength(300).IsRequired();
        builder.Property(i => i.Description).HasColumnType("text");
        builder.Property(i => i.Order).IsRequired();
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(i => i.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasData(
            // DocumentType items
            new { Id = new Guid("22222222-0000-0000-0001-000000000001"), CodeListId = DocumentTypeId, Code = "PALYAZATI", Name = "Pályázati dokumentum", Description = (string?)null, Order = 1, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0001-000000000002"), CodeListId = DocumentTypeId, Code = "SZAMLA", Name = "Számla", Description = (string?)null, Order = 2, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0001-000000000003"), CodeListId = DocumentTypeId, Code = "SZERZODES", Name = "Szerződés", Description = (string?)null, Order = 3, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0001-000000000004"), CodeListId = DocumentTypeId, Code = "EGYEB", Name = "Egyéb dokumentum", Description = (string?)null, Order = 4, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },

            // SubmissionMethod items
            new { Id = new Guid("22222222-0000-0000-0002-000000000001"), CodeListId = SubmissionMethodId, Code = "ONLINE", Name = "Online", Description = (string?)null, Order = 1, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0002-000000000002"), CodeListId = SubmissionMethodId, Code = "PAPIR", Name = "Papíralapú", Description = (string?)null, Order = 2, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0002-000000000003"), CodeListId = SubmissionMethodId, Code = "EMAIL", Name = "E-mail", Description = (string?)null, Order = 3, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },

            // SettlementMethod items
            new { Id = new Guid("22222222-0000-0000-0003-000000000001"), CodeListId = SettlementMethodId, Code = "ATUTALAS", Name = "Banki átutalás", Description = (string?)null, Order = 1, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0003-000000000002"), CodeListId = SettlementMethodId, Code = "KESZPENZ", Name = "Készpénz", Description = (string?)null, Order = 2, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },

            // ApplicationType items
            new { Id = new Guid("22222222-0000-0000-0004-000000000001"), CodeListId = ApplicationTypeId, Code = "HELYI", Name = "Helyi pályázat", Description = (string?)null, Order = 1, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0004-000000000002"), CodeListId = ApplicationTypeId, Code = "REGIONALIS", Name = "Regionális pályázat", Description = (string?)null, Order = 2, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0004-000000000003"), CodeListId = ApplicationTypeId, Code = "NEMZETI", Name = "Nemzeti pályázat", Description = (string?)null, Order = 3, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate },
            new { Id = new Guid("22222222-0000-0000-0004-000000000004"), CodeListId = ApplicationTypeId, Code = "EU", Name = "Európai uniós pályázat", Description = (string?)null, Order = 4, Status = CodeListItemStatus.Active, IsDeleted = false, CreatedAt = SeedDate, UpdatedAt = SeedDate }
        );
    }
}
