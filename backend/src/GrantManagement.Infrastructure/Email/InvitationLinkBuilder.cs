using GrantManagement.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace GrantManagement.Infrastructure.Email;

public sealed class InvitationLinkBuilder : IInvitationLinkBuilder
{
    private readonly string _frontendBaseUrl;

    public InvitationLinkBuilder(IConfiguration configuration)
    {
        _frontendBaseUrl = configuration["Frontend:BaseUrl"]
            ?? configuration.GetSection("AllowedOrigins").Get<string[]>()?.FirstOrDefault()
            ?? "http://localhost:4200";
    }

    public string BuildAcceptUrl(string invitationToken)
        => $"{_frontendBaseUrl.TrimEnd('/')}/auth/accept?token={Uri.EscapeDataString(invitationToken)}";
}
