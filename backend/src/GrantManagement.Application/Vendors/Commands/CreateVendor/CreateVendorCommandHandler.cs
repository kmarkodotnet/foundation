using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Application.Vendors.Queries.GetVendors;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Vendors.Commands.CreateVendor;

public class CreateVendorCommandHandler : IRequestHandler<CreateVendorCommand, CreateVendorResult>
{
    private readonly IApplicationDbContext _context;

    public CreateVendorCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateVendorResult> Handle(CreateVendorCommand request, CancellationToken cancellationToken)
    {
        var nameExists = await _context.Vendors
            .AnyAsync(v => v.Name == request.Name.Trim(), cancellationToken);

        if (nameExists)
            throw new DomainException("Ez a szerződő cég már szerepel a rendszerben.");

        TaxNumber? taxNumber = null;
        bool hasTaxNumberWarning = false;

        if (!string.IsNullOrWhiteSpace(request.TaxNumber))
        {
            taxNumber = new TaxNumber(request.TaxNumber);
            hasTaxNumberWarning = !taxNumber.IsValid;
        }

        var contact = new ContactInfo(request.Phone, request.Email);
        var vendor = Vendor.Create(request.Name, taxNumber, request.Address, contact);

        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateVendorResult(GetVendorsQueryHandler.MapToDto(vendor), hasTaxNumberWarning);
    }
}
