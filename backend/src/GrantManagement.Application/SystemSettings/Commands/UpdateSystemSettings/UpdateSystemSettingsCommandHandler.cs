using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.SystemSettings.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.SystemSettings.Commands.UpdateSystemSettings;

public class UpdateSystemSettingsCommandHandler
    : IRequestHandler<UpdateSystemSettingsCommand, SystemSettingsDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateSystemSettingsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SystemSettingsDto> Handle(
        UpdateSystemSettingsCommand request,
        CancellationToken cancellationToken)
    {
        var settings = await _context.SystemSettings
            .FirstOrDefaultAsync(cancellationToken);

        if (settings is null)
        {
            settings = Domain.Entities.SystemSettings.CreateDefault();
            _context.SystemSettings.Add(settings);
        }

        settings.Update(
            request.NotificationWarningDays,
            request.SpendingWarningDays,
            request.MaxFileSizeMb,
            request.OrganizationName,
            request.InvitationExpiryHours);

        await _context.SaveChangesAsync(cancellationToken);

        return new SystemSettingsDto(
            settings.NotificationWarningDays,
            settings.SpendingWarningDays,
            settings.MaxFileSizeMb,
            settings.OrganizationName,
            settings.InvitationExpiryHours,
            settings.UpdatedAt);
    }
}
