using AutoMapper;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GrantManagement.Application.Auth.Commands.GoogleLogin;

public sealed class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IJwtService _jwtService;
    private readonly IMapper _mapper;
    private readonly ILogger<GoogleLoginCommandHandler> _logger;

    public GoogleLoginCommandHandler(
        IApplicationDbContext context,
        IGoogleAuthService googleAuthService,
        IJwtService jwtService,
        IMapper mapper,
        ILogger<GoogleLoginCommandHandler> logger)
    {
        _context = context;
        _googleAuthService = googleAuthService;
        _jwtService = jwtService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<AuthResultDto> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var googleUser = await _googleAuthService.ExchangeCodeAsync(
            request.AuthorizationCode,
            request.RedirectUri,
            cancellationToken);

        var appUser = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.Email == googleUser.Email, cancellationToken);

        if (appUser is null)
        {
            _logger.LogWarning(
                "No-invitation login attempt: {Email}",
                googleUser.Email);
            throw new NoInvitationException(googleUser.Email);
        }

        if (appUser.Status == UserStatus.Inactive)
            throw new InactiveUserException();

        appUser.SyncFromGoogle(googleUser.FullName, googleUser.PictureUrl);
        appUser.RecordLogin(DateTimeOffset.UtcNow);
        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(appUser);
        var userProfile = _mapper.Map<UserProfileDto>(appUser);

        return new AuthResultDto(token, _jwtService.ExpiresInSeconds, userProfile);
    }
}
