using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Application.Vendors.Queries.GetVendors;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Vendors.Commands.DeactivateVendor;

public class DeactivateVendorCommandHandler : IRequestHandler<DeactivateVendorCommand, VendorDto>
{
    private readonly IApplicationDbContext _context;

    public DeactivateVendorCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorDto> Handle(DeactivateVendorCommand request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, cancellationToken)
            ?? throw new NotFoundException(nameof(Vendor), request.VendorId);

        vendor.Deactivate();
        await _context.SaveChangesAsync(cancellationToken);

        return GetVendorsQueryHandler.MapToDto(vendor);
    }
}
