using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Users.Commands.ActivateUser;

public class ActivateUserCommandHandler : IRequestHandler<ActivateUserCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ActivateUserCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(ActivateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", request.UserId);

        if (user.Status == UserStatus.Active)
            return Unit.Value;

        user.Reactivate();

        _context.AuditLogs.Add(AuditLog.Record(
            "AppUser", user.Id, AuditAction.Update,
            _currentUser.UserId, _currentUser.IpAddress,
            "Status", "Inactive", "Active"));

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
