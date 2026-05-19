namespace GrantManagement.API.Common;

public static class Policies
{
    public const string CanCreateApplication  = "CanCreateApplication";
    public const string CanApproveApplication = "CanApproveApplication";
    public const string CanManageInvoices     = "CanManageInvoices";
    public const string CanManageUsers        = "CanManageUsers";
    public const string CanViewAuditLog       = "CanViewAuditLog";
    public const string CanManageCodelists    = "CanManageCodelists";
    public const string CanManageGranters     = "CanManageGranters";
    public const string CanManageVendors      = "CanManageVendors";
}
