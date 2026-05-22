using GrantManagement.Application.Vendors.DTOs;
using MediatR;

namespace GrantManagement.Application.Vendors.Queries.GetVendorDetail;

public record GetVendorDetailQuery(Guid VendorId) : IRequest<VendorDetailDto>;
