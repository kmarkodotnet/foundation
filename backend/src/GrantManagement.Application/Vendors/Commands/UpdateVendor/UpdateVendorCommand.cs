using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Vendors.Commands.UpdateVendor;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record UpdateVendorCommand(
    Guid VendorId,
    string Name,
    string? TaxNumber,
    string? Address,
    string? Phone,
    string? Email
) : IRequest<VendorDetailDto>;
