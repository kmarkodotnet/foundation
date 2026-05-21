using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.VendorContracts.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.VendorContracts.Commands.CreateVendorContract;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record CreateVendorContractCommand(
    Guid ApplicationId,
    Guid VendorId,
    decimal Amount,
    string Currency,
    DateOnly? ContractDate,
    string? ContractIdentifier,
    Guid? BudgetItemId,
    string? Notes
) : IRequest<VendorContractDto>, IApplicationCommand;
