using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Settlement.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Settlement.Queries.GetSettlement;

public class GetSettlementQueryHandler : IRequestHandler<GetSettlementQuery, SettlementDto?>
{
    private readonly IApplicationDbContext _context;

    public GetSettlementQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SettlementDto?> Handle(
        GetSettlementQuery request,
        CancellationToken cancellationToken)
    {
        // Verify the application exists
        var applicationExists = await _context.Applications
            .AsNoTracking()
            .AnyAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (!applicationExists)
            throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var settlement = await _context.Settlements
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ApplicationId == request.ApplicationId, cancellationToken);

        if (settlement == null)
            return null;

        // Load application for awarded amount
        var application = await _context.Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        var awardedAmount = application?.Result?.AwardedAmountValue ?? 0m;

        // Invoices global query filter (!IsDeleted) is active — this respects it
        var totalInvoiced = await _context.Invoices
            .Where(i => i.ApplicationId == request.ApplicationId)
            .SumAsync(i => i.Amount, cancellationToken);

        var coveragePercent = awardedAmount > 0
            ? Math.Round(totalInvoiced / awardedAmount * 100, 2)
            : 0m;

        return new SettlementDto
        {
            Id = settlement.Id,
            ApplicationId = settlement.ApplicationId,
            SettlementDate = settlement.SettlementDate,
            SettlementMethodId = settlement.SettlementMethodId,
            Description = settlement.Description,
            Notes = settlement.Notes,
            InvoiceCoveragePercent = coveragePercent,
            HasLowCoverageWarning = coveragePercent < 80m,
            ApprovedAt = settlement.ApprovedAt,
            ApprovedByUserId = settlement.ApprovedByUserId,
            CreatedAt = settlement.CreatedAt,
            UpdatedAt = settlement.UpdatedAt,
        };
    }
}
