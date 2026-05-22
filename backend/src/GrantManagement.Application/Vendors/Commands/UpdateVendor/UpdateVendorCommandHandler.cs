using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Vendors.Commands.UpdateVendor;

public class UpdateVendorCommandHandler : IRequestHandler<UpdateVendorCommand, VendorDetailDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateVendorCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorDetailDto> Handle(UpdateVendorCommand request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, cancellationToken)
            ?? throw new NotFoundException(nameof(Vendor), request.VendorId);

        var nameConflict = await _context.Vendors
            .AnyAsync(v => v.Name == request.Name.Trim() && v.Id != request.VendorId, cancellationToken);

        if (nameConflict)
            throw new DomainException("Ez a szerződő cég már szerepel a rendszerben.");

        TaxNumber? taxNumber = null;
        if (!string.IsNullOrWhiteSpace(request.TaxNumber))
            taxNumber = new TaxNumber(request.TaxNumber);

        var contact = new ContactInfo(request.Phone, request.Email);
        vendor.Update(request.Name, taxNumber, request.Address, contact);

        await _context.SaveChangesAsync(cancellationToken);

        var contracts = await _context.VendorContracts
            .AsNoTracking()
            .Where(vc => vc.VendorId == vendor.Id)
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
