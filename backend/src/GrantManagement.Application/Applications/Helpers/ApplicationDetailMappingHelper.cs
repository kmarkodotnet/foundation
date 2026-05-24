using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Applications.Helpers;

public static class ApplicationDetailMappingHelper
{
    public static async Task<ApplicationDetailDto> MapToDetailDtoAsync(
        IApplicationDbContext context,
        IMapper mapper,
        GrantApp application,
        CancellationToken cancellationToken)
    {
        var granter = await context.Granters
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == application.GranterId, cancellationToken);

        var creator = await context.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == application.CreatedByUserId, cancellationToken);

        string? applicationTypeName = null;
        if (application.CallData?.ApplicationTypeId.HasValue == true)
        {
            var typeItem = await context.CodeListItems
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == application.CallData.ApplicationTypeId!.Value, cancellationToken);
            applicationTypeName = typeItem?.Name;
        }

        return mapper.Map<ApplicationDetailDto>(application, opts =>
        {
            opts.Items["GranterName"] = granter?.Name ?? string.Empty;
            opts.Items["CreatedByUserName"] = creator?.Name ?? string.Empty;
            opts.Items["ApplicationTypeName"] = applicationTypeName;
        });
    }
}
