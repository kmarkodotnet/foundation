using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Applications.Queries.GetApplicationDetail;

public class GetApplicationDetailQueryHandler
    : IRequestHandler<GetApplicationDetailQuery, ApplicationDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetApplicationDetailQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApplicationDetailDto> Handle(
        GetApplicationDetailQuery request,
        CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Include(a => a.WorkflowSteps)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        var granter = await _context.Granters
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == application.GranterId, cancellationToken);

        return _mapper.Map<ApplicationDetailDto>(
            application,
            opts => opts.Items["GranterName"] = granter?.Name ?? string.Empty);
    }
}
