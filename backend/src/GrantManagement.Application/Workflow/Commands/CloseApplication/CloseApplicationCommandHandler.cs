using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Workflow.Commands.CloseApplication;

public class CloseApplicationCommandHandler
    : IRequestHandler<CloseApplicationCommand, ApplicationDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CloseApplicationCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApplicationDetailDto> Handle(
        CloseApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        application.ManualClose();
        await _context.SaveChangesAsync(cancellationToken);

        var granter = await _context.Granters
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == application.GranterId, cancellationToken);

        return _mapper.Map<ApplicationDetailDto>(
            application,
            opts => opts.Items["GranterName"] = granter?.Name ?? string.Empty);
    }
}
