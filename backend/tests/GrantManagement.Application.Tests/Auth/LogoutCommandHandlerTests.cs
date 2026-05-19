using FluentAssertions;
using GrantManagement.Application.Auth.Commands.Logout;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Auth;

public class LogoutCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly LogoutCommandHandler _sut;

    public LogoutCommandHandlerTests()
    {
        _sut = new LogoutCommandHandler(
            _contextMock.Object,
            _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WhenUserExists_ShouldRecordLogoutAndSave()
    {
        // Arrange
        var existingUser = AppUser.CreateFromGoogle("google-id-logout", "logout@test.com", "Logout User", null);
        var userId = existingUser.Id; // capture the Id assigned by CreateFromGoogle

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var appUsers = new List<AppUser> { existingUser };
        var mockDbSet = CreateMockDbSet(appUsers);

        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(new LogoutCommand(), CancellationToken.None);

        // Assert
        result.Should().Be(Unit.Value);
        existingUser.LastLogoutAt.Should().NotBeNull();
        existingUser.LastLogoutAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ShouldReturnUnitWithoutSaving()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var appUsers = new List<AppUser>(); // empty — user not in DB
        var mockDbSet = CreateMockDbSet(appUsers);

        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);

        // Act
        var result = await _sut.Handle(new LogoutCommand(), CancellationToken.None);

        // Assert
        result.Should().Be(Unit.Value);
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
