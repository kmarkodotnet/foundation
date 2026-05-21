using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Common;
using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Infrastructure.Persistence;

public class AppDbContext : DbContext, IApplicationDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<GrantApp> Applications => Set<GrantApp>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<EmailAttachment> EmailAttachments => Set<EmailAttachment>();
    public DbSet<BudgetPlan> BudgetPlans => Set<BudgetPlan>();
    public DbSet<BudgetItem> BudgetItems => Set<BudgetItem>();
    public DbSet<VendorContract> VendorContracts => Set<VendorContract>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<ProofRecord> ProofRecords => Set<ProofRecord>();
    public DbSet<ProofPhoto> ProofPhotos => Set<ProofPhoto>();
    public DbSet<Settlement> Settlements => Set<Settlement>();
    public DbSet<Granter> Granters => Set<Granter>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<CodeList> CodeLists => Set<CodeList>();
    public DbSet<CodeListItem> CodeListItems => Set<CodeListItem>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Ignore<DomainEvent>();
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<Comment>().HasQueryFilter(c => !c.IsDeleted);
        modelBuilder.Entity<Document>().HasQueryFilter(d => !d.IsArchived);
        modelBuilder.Entity<GrantApp>().HasQueryFilter(a => !a.IsArchived);
        modelBuilder.Entity<Invoice>().HasQueryFilter(i => !i.IsDeleted);
        modelBuilder.Entity<ProofRecord>().HasQueryFilter(p => !p.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity<Guid>>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.GetType().GetProperty(nameof(BaseEntity<Guid>.CreatedAt))
                        ?.SetValue(entry.Entity, DateTimeOffset.UtcNow);
                    entry.Entity.GetType().GetProperty(nameof(BaseEntity<Guid>.UpdatedAt))
                        ?.SetValue(entry.Entity, DateTimeOffset.UtcNow);
                    break;
                case EntityState.Modified:
                    entry.Entity.GetType().GetProperty(nameof(BaseEntity<Guid>.UpdatedAt))
                        ?.SetValue(entry.Entity, DateTimeOffset.UtcNow);
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
