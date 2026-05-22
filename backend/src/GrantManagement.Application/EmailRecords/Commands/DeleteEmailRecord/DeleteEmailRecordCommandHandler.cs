using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.EmailRecords.Commands.DeleteEmailRecord;

public class DeleteEmailRecordCommandHandler : IRequestHandler<DeleteEmailRecordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteEmailRecordCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(DeleteEmailRecordCommand request, CancellationToken cancellationToken)
    {
        var record = await _context.EmailRecords
            .FirstOrDefaultAsync(e => e.Id == request.EmailRecordId
                && e.ApplicationId == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("EmailRecord", request.EmailRecordId);

        var isOwner = record.CreatedByUserId == _currentUser.UserId;
        var isAdmin = _currentUser.Role == UserRole.Admin;

        if (!isOwner && !isAdmin)
            throw new ForbiddenException("Csak a rögzítő felhasználó vagy az Admin törölheti az e-mail rekordot.");

        record.SoftDelete();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
