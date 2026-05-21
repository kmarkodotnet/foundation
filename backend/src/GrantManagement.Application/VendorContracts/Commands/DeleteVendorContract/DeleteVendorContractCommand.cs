using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.VendorContracts.Commands.DeleteVendorContract;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record DeleteVendorContractCommand(
    Guid ApplicationId,
    Guid ContractId
) : IRequest, IApplicationCommand;
