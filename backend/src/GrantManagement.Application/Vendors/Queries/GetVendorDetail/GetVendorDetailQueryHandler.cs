using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Application.Vendors.Queries.GetVendors;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Vendors.Queries.GetVendorDetail;

public class GetVendorDetailQueryHandler : IRequestHandler<GetVendorDetailQuery, VendorDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetVendorDetailQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorDetailDto> Handle(GetVendorDetailQuery request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, cancellationToken)
            ?? throw new NotFoundException(nameof(Vendor), request.VendorId);

        var contracts = await _context.VendorContracts
            .AsNoTracking()
            .Where(vc => vc.VendorId == request.VendorId)
            .Join(
                _context.Applications.IgnoreQueryFilters().AsNoTracking(),
                vc => vc.ApplicationId,
                a => a.Id,
                (vc, a) => new VendorContractSummaryDto
                {
                    ApplicationId = vc.ApplicationId,
                    ApplicationTitle = a.Title,
                    Amount = vc.AmountValue,
                    Currency = vc.Currency,
                    ContractDate = vc.ContractDate,
                })
            .OrderByDescending(c => c.ContractDate)
            .ToListAsync(cancellationToken);

        return new VendorDetailDto
        {
            Id = vendor.Id,
            Name = vendor.Name,
            TaxNumber = vendor.TaxNumber?.Value,
            Address = vendor.Address,
            Phone = vendor.Contact.PhoneNumber,
            Email = vendor.Contact.Email,
            Status = vendor.Status.ToString(),
            CreatedAt = vendor.CreatedAt,
            UpdatedAt = vendor.UpdatedAt,
            Contracts = contracts,
            Summary = new VendorSummaryDto
            {
                TotalContracts = contracts.Count,
                TotalAmount = contracts.Sum(c => c.Amount),
            },
        };
    }
}
