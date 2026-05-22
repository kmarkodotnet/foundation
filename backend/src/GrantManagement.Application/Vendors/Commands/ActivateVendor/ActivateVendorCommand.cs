using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Vendors.Commands.ActivateVendor;

[RequireRole(UserRole.Admin)]
public record ActivateVendorCommand(Guid VendorId) : IRequest<VendorDto>;
