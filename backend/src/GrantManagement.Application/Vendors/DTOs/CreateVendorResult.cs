namespace GrantManagement.Application.Vendors.DTOs;

public record CreateVendorResult(VendorDto Vendor, bool HasTaxNumberWarning);
