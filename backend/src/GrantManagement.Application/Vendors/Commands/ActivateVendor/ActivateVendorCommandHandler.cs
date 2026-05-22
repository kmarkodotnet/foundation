using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Application.Vendors.Queries.GetVendors;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Vendors.Commands.ActivateVendor;

public class ActivateVendorCommandHandler : IRequestHandler<ActivateVendorCommand, VendorDto>
{
    private readonly IApplicationDbContext _context;

    public ActivateVendorCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorDto> Handle(ActivateVendorCommand request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, cancellationToken)
            ?? throw new NotFoundException(nameof(Vendor), request.VendorId);

        vendor.Reactivate();
        await _context.SaveChangesAsync(cancellationToken);

        return GetVendorsQueryHandler.MapToDto(vendor);
    }
}
