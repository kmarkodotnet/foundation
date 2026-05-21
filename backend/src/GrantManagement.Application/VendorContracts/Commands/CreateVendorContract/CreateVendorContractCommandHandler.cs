using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.VendorContracts.DTOs;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.VendorContracts.Commands.CreateVendorContract;

public class CreateVendorContractCommandHandler : IRequestHandler<CreateVendorContractCommand, VendorContractDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateVendorContractCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorContractDto> Handle(CreateVendorContractCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .Include(a => a.VendorContracts)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        if (application.Status != ApplicationStatus.Won)
            throw new DomainException("Szállítói szerződés csak nyert pályázathoz rögzíthető.");

        var vendorContractStep = application.WorkflowSteps
            .FirstOrDefault(s => s.StepType == WorkflowStepType.VendorContracts);
        if (vendorContractStep == null || vendorContractStep.Status != WorkflowStepStatus.Active)
            throw new DomainException("A Szállítói szerződések lépés nem szerkeszthető ebben az állapotban.");

        var vendor = await _context.Vendors
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, cancellationToken)
            ?? throw new NotFoundException("Vendor", request.VendorId);

        string? budgetItemName = null;
        if (request.BudgetItemId.HasValue)
        {
            var budgetItem = await _context.BudgetItems
                .AsNoTracking()
                .FirstOrDefaultAsync(bi => bi.Id == request.BudgetItemId.Value, cancellationToken)
                ?? throw new NotFoundException("BudgetItem", request.BudgetItemId.Value);
            budgetItemName = budgetItem.Name;
        }

        var money = new Money(request.Amount, request.Currency);
        var contract = application.AddVendorContract(
            request.VendorId,
            money,
            _currentUser.UserId,
            request.ContractIdentifier,
            request.ContractDate,
            request.BudgetItemId,
            request.Notes);

        _context.VendorContracts.Add(contract);
        await _context.SaveChangesAsync(cancellationToken);

        return new VendorContractDto
        {
            Id = contract.Id,
            ApplicationId = contract.ApplicationId,
            VendorId = contract.VendorId,
            VendorName = vendor.Name,
            ContractIdentifier = contract.ContractIdentifier,
            ContractDate = contract.ContractDate,
            Amount = contract.AmountValue,
            Currency = contract.Currency,
            BudgetItemId = contract.BudgetItemId,
            BudgetItemName = budgetItemName,
            Notes = contract.Notes,
            CreatedByUserId = contract.CreatedByUserId,
            CreatedAt = contract.CreatedAt,
        };
    }
}
