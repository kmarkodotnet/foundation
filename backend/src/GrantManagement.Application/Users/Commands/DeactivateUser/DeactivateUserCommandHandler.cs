using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Users.Commands.DeactivateUser;

public class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeactivateUserCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(DeactivateUserCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId == _currentUser.UserId)
            throw new DomainException("Nem inaktiválhatja saját fiókját.");

        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("AppUser", request.UserId);

        if (user.Status == UserStatus.Inactive)
            return Unit.Value;

        if (user.Role == UserRole.Admin)
        {
            var remainingActiveAdmins = await _context.AppUsers
                .AsNoTracking()
                .CountAsync(u =>
                    u.Role == UserRole.Admin &&
                    u.Status == UserStatus.Active &&
                    u.Id != request.UserId,
                    cancellationToken);

            if (remainingActiveAdmins == 0)
                throw new DomainException("Legalább egy aktív adminisztrátornak kell maradnia.");
        }

        user.Deactivate();

        _context.AuditLogs.Add(AuditLog.Record(
            "AppUser", user.Id, AuditAction.Update,
            _currentUser.UserId, _currentUser.IpAddress,
            "Status", "Active", "Inactive"));

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
