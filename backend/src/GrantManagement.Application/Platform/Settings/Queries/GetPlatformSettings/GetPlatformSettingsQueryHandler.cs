using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Settings.Queries.GetPlatformSettings;

public sealed class GetPlatformSettingsQueryHandler : IRequestHandler<GetPlatformSettingsQuery, PlatformSettingsDto>
{
    private readonly IApplicationDbContext _db;

    public GetPlatformSettingsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PlatformSettingsDto> Handle(GetPlatformSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _db.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken)
            ?? PlatformSettings.CreateDefault();

        return new PlatformSettingsDto(
            settings.Id,
            settings.MaxFileSizeMb,
            settings.InvitationExpiryHours,
            settings.DefaultDeadlineNotificationDays,
            settings.DefaultOwnerCodeListTemplateId);
    }
}
