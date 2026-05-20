using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Granters.Queries.GetGranterDetail;

public class GetGranterDetailQueryHandler
    : IRequestHandler<GetGranterDetailQuery, GranterDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetGranterDetailQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GranterDetailDto> Handle(
        GetGranterDetailQuery request,
        CancellationToken cancellationToken)
    {
        var granter = await _context.Granters
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == request.GranterId, cancellationToken)
            ?? throw new NotFoundException(nameof(Granter), request.GranterId);

        var applications = await _context.Applications
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(a => a.GranterId == request.GranterId)
            .Select(a => new GranterApplicationDto
            {
                Id = a.Id,
                Title = a.Title,
                Identifier = a.Identifier,
                Status = a.Status,
                AwardedAmount = a.Result != null && a.Result.AwardedAmount != null
                    ? a.Result.AwardedAmount.Amount
                    : (decimal?)null
            })
            .OrderByDescending(a => a.Status)
            .ToListAsync(cancellationToken);

        return new GranterDetailDto
        {
            Id = granter.Id,
            Name = granter.Name,
            Description = granter.Description,
            PhoneNumber = granter.Contact.PhoneNumber,
            Email = granter.Contact.Email,
            Status = granter.Status.ToString(),
            CreatedAt = granter.CreatedAt,
            UpdatedAt = granter.UpdatedAt,
            Applications = applications
        };
    }
}
