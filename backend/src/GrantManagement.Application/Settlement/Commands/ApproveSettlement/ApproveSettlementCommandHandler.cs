using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Applications.Helpers;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Settlement.Commands.ApproveSettlement;

public class ApproveSettlementCommandHandler : IRequestHandler<ApproveSettlementCommand, ApplicationDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public ApproveSettlementCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApplicationDetailDto> Handle(
        ApproveSettlementCommand request,
        CancellationToken cancellationToken)
    {
        if (request.IsApproved)
        {
            // Load Application with WorkflowSteps AND Settlement (both are safe — no global query filter)
            var application = await _context.Applications
                .Include(a => a.WorkflowSteps)
                .Include(a => a.Settlement)
                .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
                ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

            application.ApproveSettlement(_currentUser.UserId);

            await _context.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Rejection: load WorkflowSteps only (no Settlement modification needed)
            var application = await _context.Applications
                .Include(a => a.WorkflowSteps)
                .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
                ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

            var step = application.WorkflowSteps
                .FirstOrDefault(s => s.StepType == WorkflowStepType.Settlement)
                ?? throw new DomainException("Settlement lépés nem található.");

            step.Reject(_currentUser.UserId, request.RejectionNote!);

            await _context.SaveChangesAsync(cancellationToken);
        }

        // Reload fresh for mapping — IgnoreQueryFilters so archived apps also work
        var updated = await _context.Applications
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        return await ApplicationDetailMappingHelper.MapToDetailDtoAsync(
            _context, _mapper, updated, cancellationToken);
    }
}
