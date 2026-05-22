using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Vendors.Commands.DeactivateVendor;

[RequireRole(UserRole.Admin)]
public record DeactivateVendorCommand(Guid VendorId) : IRequest<VendorDto>;
