using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Settlement.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Settlement.Commands.RecordSettlement;

public class RecordSettlementCommandHandler : IRequestHandler<RecordSettlementCommand, SettlementDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RecordSettlementCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SettlementDto> Handle(
        RecordSettlementCommand request,
        CancellationToken cancellationToken)
    {
        // Load application AsNoTracking for validation — avoids modifying Application row
        var application = await _context.Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (application.Status != ApplicationStatus.Won)
            throw new DomainException("Elszámolás csak nyert pályázathoz rögzíthető.");

        // Calculate invoice coverage (Invoices have a global query filter for !IsDeleted,
        // but we query directly from the context which respects the filter)
        var totalInvoiced = await _context.Invoices
            .Where(i => i.ApplicationId == request.ApplicationId)
            .SumAsync(i => i.Amount, cancellationToken);

        var awardedAmount = application.Result?.AwardedAmountValue ?? 0m;

        // Load Settlement tracked for create/update
        var settlement = await _context.Settlements
            .FirstOrDefaultAsync(s => s.ApplicationId == request.ApplicationId, cancellationToken);

        var p = new SettlementParams
        {
            SettlementDate = request.SettlementDate,
            SettlementMethodId = request.SettlementMethodId,
            Description = request.Description,
            Notes = request.Notes,
        };

        if (settlement == null)
        {
            settlement = Domain.Entities.Settlement.Create(request.ApplicationId, p, _currentUser.UserId);
            _context.Settlements.Add(settlement);
        }
        else
        {
            settlement.Update(p);
        }

        await _context.SaveChangesAsync(cancellationToken);

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
