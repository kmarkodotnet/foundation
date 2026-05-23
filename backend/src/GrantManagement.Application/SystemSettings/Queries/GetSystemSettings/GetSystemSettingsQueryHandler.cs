using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.SystemSettings.DTOs;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.SystemSettings.Queries.GetSystemSettings;

public class GetSystemSettingsQueryHandler
    : IRequestHandler<GetSystemSettingsQuery, SystemSettingsDto>
{
    private readonly IApplicationDbContext _context;

    public GetSystemSettingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SystemSettingsDto> Handle(
        GetSystemSettingsQuery request,
        CancellationToken cancellationToken)
    {
        var settings = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken)
            ?? Domain.Entities.SystemSettings.CreateDefault();

        return new SystemSettingsDto(
            settings.NotificationWarningDays,
            settings.SpendingWarningDays,
            settings.MaxFileSizeMb,
            settings.OrganizationName,
            settings.DefaultUserRole.ToString(),
            settings.UpdatedAt);
    }
}
