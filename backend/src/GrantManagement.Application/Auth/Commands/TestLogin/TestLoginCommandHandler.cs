using AutoMapper;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Interfaces.Services;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Tenancy.Enums;
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
            .Include(u => u.FoundationAssignments)
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

        // A teszt-usereknek is érvényes tenant-scope kell, különben a
        // fail-safe query filterek minden adatot kizárnak.
        if (!user.PlatformRole.HasValue)
        {
            if (!user.OwnerId.HasValue)
                user.BindToOwner(TenancyDefaults.OwnerId);

            if (!user.FoundationAssignments.Any(a => a.FoundationId == TenancyDefaults.FoundationId && a.IsActive))
                user.AssignToFoundation(TenancyDefaults.FoundationId, MapToFoundationRole(role), user.Id);
        }

        user.RecordLogin(DateTimeOffset.UtcNow);
        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(user);
        var profile = _mapper.Map<UserProfileDto>(user);
        return new AuthResultDto(token, _jwtService.ExpiresInSeconds, profile);
    }

    private static FoundationRole MapToFoundationRole(UserRole role) => role switch
    {
        UserRole.Admin => FoundationRole.FoundationAdmin,
        UserRole.Elnok => FoundationRole.Elnok,
        UserRole.PalyazatiMunkatars => FoundationRole.PalyazatiMunkatars,
        UserRole.Penzugyes => FoundationRole.Penzugyes,
        _ => FoundationRole.Megtekinto
    };
}
