using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Applications.Commands.UpdateApplication;

public class UpdateApplicationCommandHandler
    : IRequestHandler<UpdateApplicationCommand, ApplicationDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateApplicationCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApplicationDetailDto> Handle(
        UpdateApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var granter = await _context.Granters
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == application.GranterId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantManagement.Domain.Entities.Granter), application.GranterId);

        var callData = new CallStepData
        {
            SubmissionDeadline = request.SubmissionDeadline,
            ApplicationTypeId = request.ApplicationTypeId,
            MinAmountValue = request.MinAmount,
            MinAmountCurrency = "HUF",
            MaxAmountValue = request.MaxAmount,
            MaxAmountCurrency = "HUF",
            SpendingDeadline = request.SpendingDeadline,
            OtherMetadata = request.OtherMetadata
        };

        application.UpdateBasicInfo(request.Title, request.Identifier, request.Description);
        application.UpdateCallData(callData);

        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ApplicationDetailDto>(
            application,
            opts => opts.Items["GranterName"] = granter.Name);
    }
}
