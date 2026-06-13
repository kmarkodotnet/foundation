using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Auth.Commands.GoogleLogin;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Mappings;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace GrantManagement.Application.Tests.Auth;

public class GoogleLoginCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<IGoogleAuthService> _googleAuthServiceMock = new();
    private readonly Mock<IJwtService> _jwtServiceMock = new();
    private readonly Mock<ILogger<GoogleLoginCommandHandler>> _loggerMock = new();
    private readonly IMapper _mapper;
    private readonly GoogleLoginCommandHandler _sut;

    public GoogleLoginCommandHandlerTests()
    {
        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<AppUser>())).Returns("test-jwt-token");
        _jwtServiceMock.Setup(j => j.ExpiresInSeconds).Returns(28800);

        _sut = new GoogleLoginCommandHandler(
            _contextMock.Object,
            _googleAuthServiceMock.Object,
            _jwtServiceMock.Object,
            _mapper,
            _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_WhenUnknownEmail_ShouldThrowNoInvitationException()
    {
        // Arrange
        var googleInfo = new GoogleUserInfo("google-id-new", "unknown@test.com", "Unknown User", null);
        var command = new GoogleLoginCommand("valid-code", "https://example.com/callback");

        _googleAuthServiceMock
            .Setup(g => g.ExchangeCodeAsync(command.AuthorizationCode, command.RedirectUri, It.IsAny<CancellationToken>()))
            .ReturnsAsync(googleInfo);

        var appUsers = new List<AppUser>(); // no matching user
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet(appUsers).Object);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NoInvitationException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenUnknownEmail_ShouldNotCallAppUsersAdd()
    {
        // Arrange
        var googleInfo = new GoogleUserInfo("google-id-new", "unknown@test.com", "Unknown User", null);
        var command = new GoogleLoginCommand("valid-code", "https://example.com/callback");

        _googleAuthServiceMock
            .Setup(g => g.ExchangeCodeAsync(command.AuthorizationCode, command.RedirectUri, It.IsAny<CancellationToken>()))
            .ReturnsAsync(googleInfo);

        var appUsers = new List<AppUser>();
        var mockDbSet = CreateMockDbSet(appUsers);
        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NoInvitationException>();
        mockDbSet.Verify(d => d.Add(It.IsAny<AppUser>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenExistingActiveUser_ShouldUpdateLastLoginAtAndSyncProfile()
    {
        // Arrange
        var existingUser = AppUser.CreateFromGoogle("google-id-existing", "existing@test.com", "Old Name", null);
        var googleInfo = new GoogleUserInfo("google-id-existing", "existing@test.com", "New Name", "https://pic.jpg");
        var command = new GoogleLoginCommand("valid-code", "https://example.com/callback");

        _googleAuthServiceMock
            .Setup(g => g.ExchangeCodeAsync(command.AuthorizationCode, command.RedirectUri, It.IsAny<CancellationToken>()))
            .ReturnsAsync(googleInfo);

        var appUsers = new List<AppUser> { existingUser };
        var mockDbSet = CreateMockDbSet(appUsers);

        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.User.FullName.Should().Be("New Name");
        result.User.PictureUrl.Should().Be("https://pic.jpg");
        existingUser.LastLoginAt.Should().NotBeNull();

        mockDbSet.Verify(d => d.Add(It.IsAny<AppUser>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserIsInactive_ShouldThrowInactiveUserException()
    {
        // Arrange
        var inactiveUser = AppUser.CreateFromGoogle("google-id-inactive", "inactive@test.com", "Inactive User", null);
        inactiveUser.Deactivate();

        var googleInfo = new GoogleUserInfo("google-id-inactive", "inactive@test.com", "Inactive User", null);
        var command = new GoogleLoginCommand("valid-code", "https://example.com/callback");

        _googleAuthServiceMock
            .Setup(g => g.ExchangeCodeAsync(command.AuthorizationCode, command.RedirectUri, It.IsAny<CancellationToken>()))
            .ReturnsAsync(googleInfo);

        var appUsers = new List<AppUser> { inactiveUser };
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet(appUsers).Object);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InactiveUserException>()
            .WithMessage("A fiókod inaktív. Kérj segítséget az adminisztrátortól.");

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    private static Mock<DbSet<AppUser>> CreateMockDbSet(List<AppUser> data)
    {
        var queryable = data.AsQueryable();
        var mockDbSet = new Mock<DbSet<AppUser>>();

        mockDbSet.As<IAsyncEnumerable<AppUser>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<AppUser>(data.GetEnumerator()));

        mockDbSet.As<IQueryable<AppUser>>()
            .Setup(m => m.Provider)
            .Returns(new TestAsyncQueryProvider<AppUser>(queryable.Provider));

        mockDbSet.As<IQueryable<AppUser>>().Setup(m => m.Expression).Returns(queryable.Expression);
        mockDbSet.As<IQueryable<AppUser>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        mockDbSet.As<IQueryable<AppUser>>().Setup(m => m.GetEnumerator()).Returns(queryable.GetEnumerator());

        return mockDbSet;
    }
}
