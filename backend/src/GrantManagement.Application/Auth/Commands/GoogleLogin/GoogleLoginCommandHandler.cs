using AutoMapper;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Auth.Commands.GoogleLogin;

public sealed class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IJwtService _jwtService;
    private readonly IMapper _mapper;

    public GoogleLoginCommandHandler(
        IApplicationDbContext context,
        IGoogleAuthService googleAuthService,
        IJwtService jwtService,
        IMapper mapper)
    {
        _context = context;
        _googleAuthService = googleAuthService;
        _jwtService = jwtService;
        _mapper = mapper;
    }

    public async Task<AuthResultDto> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var googleUser = await _googleAuthService.ExchangeCodeAsync(
            request.AuthorizationCode,
            request.RedirectUri,
            cancellationToken);

        var appUser = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.GoogleId == googleUser.GoogleId, cancellationToken);

        if (appUser is null)
        {
            var settings = await _context.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);

            var defaultRole = settings?.DefaultUserRole ?? Domain.Enums.UserRole.Megtekinto;

            // First user ever becomes Admin automatically
            var anyUserExists = await _context.AppUsers.AsNoTracking().AnyAsync(cancellationToken);
            if (!anyUserExists) defaultRole = Domain.Enums.UserRole.Admin;

            appUser = AppUser.CreateFromGoogle(
                googleUser.GoogleId,
                googleUser.Email,
                googleUser.FullName,
                googleUser.PictureUrl,
                defaultRole);

            _context.AppUsers.Add(appUser);
        }
        else
        {
            EnsureUserIsActive(appUser);
            appUser.SyncFromGoogle(googleUser.FullName, googleUser.PictureUrl);
        }

        appUser.RecordLogin(DateTimeOffset.UtcNow);
        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(appUser);
        var userProfile = _mapper.Map<UserProfileDto>(appUser);

        return new AuthResultDto(token, _jwtService.ExpiresInSeconds, userProfile);
    }

    private static void EnsureUserIsActive(AppUser user)
    {
        if (user.Status == UserStatus.Inactive)
            throw new InactiveUserException();
    }
}
