using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Applications.Helpers;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
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

        return await ApplicationDetailMappingHelper.MapToDetailDtoAsync(
            _context, _mapper, application, cancellationToken);
    }
}
