using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Applications.Helpers;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.RecordResult;

public class RecordResultCommandHandler
    : IRequestHandler<RecordResultCommand, ApplicationDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public RecordResultCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _context = context;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApplicationDetailDto> Handle(
        RecordResultCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        ApplicationResult result;

        if (request.IsWon)
        {
            result = ApplicationResult.Won(
                request.ResultDate!.Value,
                new Money(request.AwardedAmount!.Value, "HUF"),
                request.ResultIdentifier);
        }
        else
        {
            var resultDate = request.ResultDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            result = ApplicationResult.Lost(resultDate, request.ResultIdentifier);
        }

        application.RecordResult(result, _currentUser.UserId);
        await _context.SaveChangesAsync(cancellationToken);

        return await ApplicationDetailMappingHelper.MapToDetailDtoAsync(
            _context, _mapper, application, cancellationToken);
    }
}
