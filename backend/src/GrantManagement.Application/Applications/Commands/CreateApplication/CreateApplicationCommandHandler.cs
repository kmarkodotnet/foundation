using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Applications.Commands.CreateApplication;

public class CreateApplicationCommandHandler
    : IRequestHandler<CreateApplicationCommand, ApplicationDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public CreateApplicationCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApplicationDetailDto> Handle(
        CreateApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var granter = await _context.Granters
            .FirstOrDefaultAsync(g => g.Id == request.GranterId, cancellationToken)
            ?? throw new NotFoundException(nameof(Granter), request.GranterId);

        if (granter.Status == GranterStatus.Inactive)
            throw new DomainException("Inaktív pályáztató nem rendelhető pályázathoz.");

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

        var application = GrantApp.Create(
            request.Title,
            request.GranterId,
            callData,
            _currentUser.UserId,
            request.Identifier,
            request.Description);

        _context.Applications.Add(application);
        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ApplicationDetailDto>(application);
    }
}
