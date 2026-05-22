using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Vendors.Commands.CreateVendor;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars, UserRole.Penzugyes)]
public record CreateVendorCommand(
    string Name,
    string? TaxNumber,
    string? Address,
    string? Phone,
    string? Email
) : IRequest<CreateVendorResult>;
