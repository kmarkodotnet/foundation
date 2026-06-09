using AutoMapper;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Auth.Commands.TestLogin;

public sealed class TestLoginCommandHandler : IRequestHandler<TestLoginCommand, AuthResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IMapper _mapper;

    public TestLoginCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        IMapper mapper)
    {
        _context = context;
        _jwtService = jwtService;
        _mapper = mapper;
    }

    public async Task<AuthResultDto> Handle(TestLoginCommand request, CancellationToken cancellationToken)
    {
        var role = Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var parsed)
            ? parsed
            : UserRole.Megtekinto;

        // Stable synthetic googleId so the same test user is reused across calls
        var testGoogleId = $"test-{request.Role.ToLowerInvariant()}";

        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.GoogleId == testGoogleId, cancellationToken);

        if (user is null)
        {
            user = AppUser.CreateFromGoogle(
                googleId: testGoogleId,
                email: request.Email,
                name: request.Name,
                pictureUrl: null,
                defaultRole: role);

            _context.AppUsers.Add(user);
        }
        else if (user.Role != role)
        {
            user.AssignRole(role);
        }

        user.RecordLogin(DateTimeOffset.UtcNow);
        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(user);
        var profile = _mapper.Map<UserProfileDto>(user);
        return new AuthResultDto(token, _jwtService.ExpiresInSeconds, profile);
    }
}
