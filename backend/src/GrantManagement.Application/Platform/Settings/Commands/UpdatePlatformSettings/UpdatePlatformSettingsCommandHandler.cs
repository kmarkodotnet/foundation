using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Settings.Commands.UpdatePlatformSettings;

public sealed class UpdatePlatformSettingsCommandHandler : IRequestHandler<UpdatePlatformSettingsCommand, UpdatePlatformSettingsResponse>
{
    private readonly IApplicationDbContext _db;

    public UpdatePlatformSettingsCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<UpdatePlatformSettingsResponse> Handle(UpdatePlatformSettingsCommand request, CancellationToken cancellationToken)
    {
        var settings = await _db.PlatformSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is null)
        {
            settings = PlatformSettings.CreateDefault();
            _db.PlatformSettings.Add(settings);
        }

        settings.Update(
            request.MaxFileSizeMb,
            request.InvitationExpiryHours,
            request.DefaultDeadlineNotificationDays,
            request.DefaultOwnerCodeListTemplateId);

        await _db.SaveChangesAsync(cancellationToken);

        return new UpdatePlatformSettingsResponse(
            settings.Id,
            settings.MaxFileSizeMb,
            settings.InvitationExpiryHours,
            settings.DefaultDeadlineNotificationDays,
            settings.DefaultOwnerCodeListTemplateId);
    }
}
