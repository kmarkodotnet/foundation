using MediatR;

namespace GrantManagement.Application.Authentication.Commands.ScopeSwitch;

public record ScopeSwitchCommand(Guid? TargetFoundationId) : IRequest<ScopeSwitchResponse>;

public record ScopeSwitchResponse(
    string AccessToken,
    int ExpiresIn,
    string Audience,
    Guid? FoundationId,
    string? FoundationName);
