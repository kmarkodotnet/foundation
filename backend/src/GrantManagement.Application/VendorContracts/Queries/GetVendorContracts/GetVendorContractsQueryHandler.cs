using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.VendorContracts.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.VendorContracts.Queries.GetVendorContracts;

public class GetVendorContractsQueryHandler : IRequestHandler<GetVendorContractsQuery, List<VendorContractDto>>
{
    private readonly IApplicationDbContext _context;

    public GetVendorContractsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<VendorContractDto>> Handle(GetVendorContractsQuery request, CancellationToken cancellationToken)
    {
        var exists = await _context.Applications
            .AsNoTracking()
            .AnyAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (!exists)
            throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var contracts = await _context.VendorContracts
            .AsNoTracking()
            .Where(vc => vc.ApplicationId == request.ApplicationId)
            .OrderByDescending(vc => vc.CreatedAt)
            .ToListAsync(cancellationToken);

        var vendorIds = contracts.Select(c => c.VendorId).Distinct().ToList();
        var budgetItemIds = contracts
            .Where(c => c.BudgetItemId.HasValue)
            .Select(c => c.BudgetItemId!.Value)
            .Distinct()
            .ToList();

        var vendors = await _context.Vendors
            .AsNoTracking()
            .Where(v => vendorIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, v => v.Name, cancellationToken);

        var budgetItems = budgetItemIds.Count > 0
            ? await _context.BudgetItems
                .AsNoTracking()
                .Where(bi => budgetItemIds.Contains(bi.Id))
                .ToDictionaryAsync(bi => bi.Id, bi => bi.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        return contracts.Select(c => new VendorContractDto
        {
            Id = c.Id,
            ApplicationId = c.ApplicationId,
            VendorId = c.VendorId,
            VendorName = vendors.GetValueOrDefault(c.VendorId, "—"),
            ContractIdentifier = c.ContractIdentifier,
            ContractDate = c.ContractDate,
            Amount = c.AmountValue,
            Currency = c.Currency,
            BudgetItemId = c.BudgetItemId,
            BudgetItemName = c.BudgetItemId.HasValue
                ? budgetItems.GetValueOrDefault(c.BudgetItemId.Value)
                : null,
            Notes = c.Notes,
            CreatedByUserId = c.CreatedByUserId,
            CreatedAt = c.CreatedAt,
        }).ToList();
    }
}
