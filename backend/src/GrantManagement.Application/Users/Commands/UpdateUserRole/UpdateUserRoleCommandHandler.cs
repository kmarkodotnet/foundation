using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Users.Commands.UpdateUserRole;

public class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateUserRoleCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", request.UserId);

        if (user.Role == UserRole.Admin && request.NewRole != UserRole.Admin)
        {
            var remainingAdmins = await _context.AppUsers
                .AsNoTracking()
                .CountAsync(u =>
                    u.Role == UserRole.Admin &&
                    u.Status == UserStatus.Active &&
                    u.Id != request.UserId,
                    cancellationToken);

            if (remainingAdmins == 0)
                throw new DomainException("Legalább egy aktív adminisztrátornak kell maradnia.");
        }

        var oldRole = user.Role.ToString();
        user.AssignRole(request.NewRole);

        _context.AuditLogs.Add(AuditLog.Record(
            "AppUser", user.Id, AuditAction.Update,
            _currentUser.UserId, _currentUser.IpAddress,
            "Role", oldRole, request.NewRole.ToString()));

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
