using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Vendors.DTOs;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Vendors.Queries.GetVendors;

public class GetVendorsQueryHandler : IRequestHandler<GetVendorsQuery, List<VendorDto>>
{
    private readonly IApplicationDbContext _context;

    public GetVendorsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<VendorDto>> Handle(GetVendorsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Vendors.AsNoTracking();

        if (!request.IncludeInactive)
            query = query.Where(v => v.Status == VendorStatus.Active);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(v => v.Name.Contains(request.Search.Trim()));

        var vendors = await query
            .OrderBy(v => v.Name)
            .ToListAsync(cancellationToken);

        return vendors.Select(MapToDto).ToList();
    }

    internal static VendorDto MapToDto(Vendor v) => new()
    {
        Id = v.Id,
        Name = v.Name,
        TaxNumber = v.TaxNumber?.Value,
        Address = v.Address,
        Phone = v.Contact.PhoneNumber,
        Email = v.Contact.Email,
        Status = v.Status.ToString(),
        CreatedAt = v.CreatedAt,
        UpdatedAt = v.UpdatedAt,
    };
}
