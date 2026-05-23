using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;
using BudgetPlanEntity = GrantManagement.Domain.Entities.BudgetPlan;
using SettlementEntity = GrantManagement.Domain.Entities.Settlement;
using SystemSettingsEntity = GrantManagement.Domain.Entities.SystemSettings;

namespace GrantManagement.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<GrantApp> Applications { get; }
    DbSet<WorkflowStep> WorkflowSteps { get; }
    DbSet<Document> Documents { get; }
    DbSet<Comment> Comments { get; }
    DbSet<EmailAttachment> EmailAttachments { get; }
    DbSet<EmailRecord> EmailRecords { get; }
    DbSet<BudgetPlanEntity> BudgetPlans { get; }
    DbSet<BudgetItem> BudgetItems { get; }
    DbSet<VendorContract> VendorContracts { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<ProofRecord> ProofRecords { get; }
    DbSet<ProofPhoto> ProofPhotos { get; }
    DbSet<SettlementEntity> Settlements { get; }
    DbSet<Granter> Granters { get; }
    DbSet<Vendor> Vendors { get; }
    DbSet<CodeList> CodeLists { get; }
    DbSet<CodeListItem> CodeListItems { get; }
    DbSet<AppUser> AppUsers { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<SystemSettingsEntity> SystemSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
