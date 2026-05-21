using GrantManagement.Application.VendorContracts.DTOs;
using MediatR;

namespace GrantManagement.Application.VendorContracts.Queries.GetVendorContracts;

public record GetVendorContractsQuery(Guid ApplicationId) : IRequest<List<VendorContractDto>>;
