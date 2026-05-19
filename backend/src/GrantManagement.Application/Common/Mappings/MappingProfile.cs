using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Auth.DTOs;
using GrantApp = GrantManagement.Domain.Entities.Application;
using GrantManagement.Domain.Entities;

namespace GrantManagement.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<GrantApp, ApplicationListItemDto>()
            .ForMember(d => d.GranterName, opt => opt.Ignore())
            .ForMember(d => d.SubmissionDeadline, opt => opt.MapFrom(
                s => s.CallData != null ? s.CallData.SubmissionDeadline : default))
            .ForMember(d => d.SpendingDeadline, opt => opt.MapFrom(
                s => s.CallData != null ? s.CallData.SpendingDeadline : null))
            .ForMember(d => d.AwardedAmount, opt => opt.MapFrom(
                s => s.Result != null && s.Result.AwardedAmount != null
                    ? s.Result.AwardedAmount.Amount
                    : (decimal?)null));

        CreateMap<GrantApp, ApplicationDetailDto>()
            .ForMember(d => d.GranterName, opt => opt.MapFrom(
                (src, dest, member, ctx) =>
                    ctx.Items.TryGetValue("GranterName", out var name) ? (string?)name : string.Empty));

        CreateMap<WorkflowStep, WorkflowStepDto>();

        CreateMap<AppUser, UserProfileDto>()
            .ConstructUsing(src => new UserProfileDto(
                src.Id,
                src.Email,
                src.Name,
                src.ProfilePictureUrl,
                src.Role.ToString(),
                src.LastLoginAt,
                new NotificationPreferencesDto(
                    src.NotificationPrefs.EmailOnDeadlineApproaching,
                    src.NotificationPrefs.EmailOnDeadlineMissed,
                    src.NotificationPrefs.EmailOnResultRecorded,
                    src.NotificationPrefs.EmailOnApprovalRequired,
                    src.NotificationPrefs.EmailOnNewComment,
                    src.NotificationPrefs.EmailOnDocumentUploaded)));
    }
}
