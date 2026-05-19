using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Auth.Commands.UpdateNotificationPreferences;

public class UpdateNotificationPreferencesCommandHandler
    : IRequestHandler<UpdateNotificationPreferencesCommand, NotificationPreferencesDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateNotificationPreferencesCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<NotificationPreferencesDto> Handle(
        UpdateNotificationPreferencesCommand request,
        CancellationToken cancellationToken)
    {
        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(AppUser), _currentUser.UserId);

        var prefs = new NotificationPreferences
        {
            EmailOnDeadlineApproaching = request.EmailOnDeadlineApproaching,
            EmailOnDeadlineMissed      = request.EmailOnDeadlineMissed,
            EmailOnResultRecorded      = request.EmailOnResultRecorded,
            EmailOnApprovalRequired    = request.EmailOnApprovalRequired,
            EmailOnNewComment          = request.EmailOnNewComment,
            EmailOnDocumentUploaded    = request.EmailOnDocumentUploaded,
        };

        user.UpdateNotificationPreferences(prefs);
        await _context.SaveChangesAsync(cancellationToken);

        return new NotificationPreferencesDto(
            prefs.EmailOnDeadlineApproaching,
            prefs.EmailOnDeadlineMissed,
            prefs.EmailOnResultRecorded,
            prefs.EmailOnApprovalRequired,
            prefs.EmailOnNewComment,
            prefs.EmailOnDocumentUploaded);
    }
}
