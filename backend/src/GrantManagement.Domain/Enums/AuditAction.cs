namespace GrantManagement.Domain.Enums;

public enum AuditAction
{
    Create,
    Update,
    Delete,
    StatusChange,
    Approve,
    Login,
    // CR2
    ScopeSwitch,
    BreakGlassAccess,
    BreakGlassRevoked,
    BreakGlassExpired,
    OwnerProvisioned,
    OwnerSuspended,
    OwnerReactivated,
    OwnerArchived,
    FoundationCreated,
    FoundationRenamed,
    FoundationArchived,
    ScopeViolation,
    FoundationAssignmentCreated,
    FoundationAssignmentRevoked,
    OwnerCodeListTemplateModified,
    OwnerUserInvited
}
