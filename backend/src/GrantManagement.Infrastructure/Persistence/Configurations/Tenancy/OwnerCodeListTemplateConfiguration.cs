using GrantManagement.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrantManagement.Infrastructure.Persistence.Configurations.Tenancy;

public class OwnerCodeListTemplateConfiguration : IEntityTypeConfiguration<OwnerCodeListTemplate>
{
    public void Configure(EntityTypeBuilder<OwnerCodeListTemplate> builder)
    {
        builder.ToTable("OwnerCodeListTemplates");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Code).IsRequired().HasMaxLength(100);

        builder.HasIndex(t => t.OwnerId);

        builder.HasMany(t => t.Items)
            .WithOne()
            .HasForeignKey("TemplateId")
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OwnerCodeListTemplateItemConfiguration : IEntityTypeConfiguration<OwnerCodeListTemplateItem>
{
    public void Configure(EntityTypeBuilder<OwnerCodeListTemplateItem> builder)
    {
        builder.ToTable("OwnerCodeListTemplateItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Value).IsRequired().HasMaxLength(200);
        builder.Property(i => i.Label).IsRequired().HasMaxLength(500);
        builder.Property(i => i.IsDeleted).HasDefaultValue(false);

        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}
