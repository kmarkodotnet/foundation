using AutoMapper;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Granters.DTOs;
using GrantApp = GrantManagement.Domain.Entities.Application;
using GrantManagement.Domain.Entities;

namespace GrantManagement.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<GrantApp, ApplicationDetailDto>()
            .ForMember(d => d.GranterName, opt => opt.MapFrom(
                (src, dest, member, ctx) =>
                    ctx.Items.TryGetValue("GranterName", out var name) ? (string?)name : string.Empty))
            .ForMember(d => d.GranterContractIdentifier, opt => opt.MapFrom(
                s => s.GranterContractData != null ? s.GranterContractData.ContractIdentifier : null))
            .ForMember(d => d.GranterContractDate, opt => opt.MapFrom(
                s => s.GranterContractData != null ? s.GranterContractData.ContractDate : null))
            .ForMember(d => d.GranterNotificationReceived, opt => opt.MapFrom(
                s => s.GranterContractData != null ? (bool?)s.GranterContractData.NotificationReceived : null))
            .ForMember(d => d.GranterNotificationDate, opt => opt.MapFrom(
                s => s.GranterContractData != null ? s.GranterContractData.NotificationDate : null));

        CreateMap<WorkflowStep, WorkflowStepDto>();

        CreateMap<Granter, GranterDto>()
            .ForMember(d => d.PhoneNumber, opt => opt.MapFrom(s => s.Contact.PhoneNumber))
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.Contact.Email))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));

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
