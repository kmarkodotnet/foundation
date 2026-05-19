using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Common.Behaviours;

public class AuthorizationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICurrentUserService _currentUser;
    private readonly IApplicationDbContext _context;

    public AuthorizationBehaviour(
        ICurrentUserService currentUser,
        IApplicationDbContext context)
    {
        _currentUser = currentUser;
        _context = context;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is IApplicationCommand cmd)
        {
            var application = await _context.Applications
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == cmd.ApplicationId, cancellationToken)
                ?? throw new NotFoundException("Application", cmd.ApplicationId);

            if (application.IsLocked && _currentUser.Role != UserRole.Admin)
                throw new ForbiddenException("Lezárt pályázat nem módosítható.");
        }

        return await next();
    }
}
