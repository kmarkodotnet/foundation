using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Users;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Infrastructure.Persistence;

public class AppDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentScopeService _scope;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentScopeService scope)
        : base(options)
    {
        _scope = scope;
    }

    public DbSet<GrantApp> Applications => Set<GrantApp>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<EmailAttachment> EmailAttachments => Set<EmailAttachment>();
    public DbSet<EmailRecord> EmailRecords => Set<EmailRecord>();
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
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Domain.Entities.SystemSettings> SystemSettings => Set<Domain.Entities.SystemSettings>();
    public DbSet<Domain.Entities.PlatformSettings> PlatformSettings => Set<Domain.Entities.PlatformSettings>();

    // CR2 Tenancy
    public DbSet<Owner> Owners => Set<Owner>();
    public DbSet<Foundation> Foundations => Set<Foundation>();
    public DbSet<BreakGlassGrant> BreakGlassGrants => Set<BreakGlassGrant>();
    public DbSet<OwnerCodeListTemplate> OwnerCodeListTemplates => Set<OwnerCodeListTemplate>();
    public DbSet<FoundationUserAssignment> FoundationUserAssignments => Set<FoundationUserAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Ignore<DomainEvent>();
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<Comment>().HasQueryFilter(c => !c.IsDeleted);
        modelBuilder.Entity<Document>().HasQueryFilter(d => !d.IsArchived);
        modelBuilder.Entity<Invoice>().HasQueryFilter(i => !i.IsDeleted);
        modelBuilder.Entity<ProofRecord>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<EmailRecord>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<CodeListItem>().HasQueryFilter(i => !i.IsDeleted);

        // Tenant-aware query filters — hatókör-fail-safe (architecture-plan CR2.E.1):
        // scope nélküli kontextus (pl. hiányzó owner_id claim, háttér-job) semmit nem lát;
        // cross-tenant hozzáférés csak whitelistelt IgnoreQueryFilters() hívással lehetséges.
        modelBuilder.Entity<GrantApp>().HasQueryFilter(a =>
            !a.IsArchived
            && a.OwnerId == _scope.OwnerId
            && (_scope.FoundationId == null || a.FoundationId == _scope.FoundationId));

        modelBuilder.Entity<Granter>().HasQueryFilter(g =>
            g.OwnerId == _scope.OwnerId
            && (_scope.FoundationId == null || g.FoundationId == _scope.FoundationId));

        modelBuilder.Entity<Vendor>().HasQueryFilter(v =>
            v.OwnerId == _scope.OwnerId
            && (_scope.FoundationId == null || v.FoundationId == _scope.FoundationId));

        modelBuilder.Entity<CodeList>().HasQueryFilter(cl =>
            !cl.IsDeleted
            && (cl.IsSystem
                || (cl.OwnerId == _scope.OwnerId
                    && (_scope.FoundationId == null || cl.FoundationId == _scope.FoundationId))));

        // Az értesítés felhasználóhoz kötött (UserId), ezért Owner-szintű izoláció elegendő:
        // foundation-váltás után is látszódnia kell a felhasználó saját értesítéseinek.
        modelBuilder.Entity<Notification>().HasQueryFilter(n =>
            n.OwnerId == _scope.OwnerId);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Audit napló append-only: törlés semmilyen szinten nem engedélyezett (US-233 AC5).
        if (ChangeTracker.Entries<AuditLog>().Any(e => e.State == EntityState.Deleted))
            throw new InvalidOperationException("Az audit napló bejegyzései nem törölhetők.");

        // Save-time scope-injection (architecture-plan CR2.E.3): az explicit scope nélkül
        // létrehozott aggregátumok az aktuális hatókört kapják; eltérő scope hiba.
        foreach (var entry in ChangeTracker.Entries<IOwnedEntity>())
        {
            if (entry.State != EntityState.Added)
                continue;

            if (entry.Entity.OwnerId == Guid.Empty && _scope.OwnerId.HasValue)
                entry.Property(nameof(IOwnedEntity.OwnerId)).CurrentValue = _scope.OwnerId.Value;
            else if (entry.Entity.OwnerId != Guid.Empty && _scope.OwnerId.HasValue && entry.Entity.OwnerId != _scope.OwnerId.Value)
                throw new InvalidOperationException(
                    $"Scope-inkonzisztencia: az aggregátum OwnerId-je ({entry.Entity.OwnerId}) eltér az aktuális hatókörtől ({_scope.OwnerId}).");

            if (entry.Entity.FoundationId == Guid.Empty && _scope.FoundationId.HasValue)
                entry.Property(nameof(IOwnedEntity.FoundationId)).CurrentValue = _scope.FoundationId.Value;
        }

        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity<Guid>>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.SetCreatedAt(now);
                    break;
                case EntityState.Modified:
                    entry.Entity.Touch(now);
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
