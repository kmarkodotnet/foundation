using GrantManagement.Application.SystemSettings.DTOs;
using MediatR;

namespace GrantManagement.Application.SystemSettings.Queries.GetSystemSettings;

public record GetSystemSettingsQuery : IRequest<SystemSettingsDto>;
