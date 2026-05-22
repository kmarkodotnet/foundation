using GrantManagement.Application.Vendors.DTOs;
using MediatR;

namespace GrantManagement.Application.Vendors.Queries.GetVendors;

public record GetVendorsQuery(string? Search, bool IncludeInactive) : IRequest<List<VendorDto>>;
