using FluentAssertions;
using GrantManagement.Application.Auth.Commands.UpdateNotificationPreferences;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Auth;

public class UpdateNotificationPreferencesCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly UpdateNotificationPreferencesCommandHandler _sut;

    public UpdateNotificationPreferencesCommandHandlerTests()
    {
        _sut = new UpdateNotificationPreferencesCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenUserExists_ShouldUpdateAllPreferencesAndReturnDto()
    {
        // Arrange
        var user = AppUser.CreateFromGoogle("google-notif-1", "notif@test.com", "Notif User", null);
        _currentUserMock.Setup(c => c.UserId).Returns(user.Id);

        var command = new UpdateNotificationPreferencesCommand(
            EmailOnDeadlineApproaching: true,
            EmailOnDeadlineMissed: false,
            EmailOnResultRecorded: true,
            EmailOnApprovalRequired: false,
            EmailOnNewComment: true,
            EmailOnDocumentUploaded: false);

        var mockDbSet = CreateMockDbSet([user]);
        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert – DTO values match command
        result.EmailOnDeadlineApproaching.Should().BeTrue();
        result.EmailOnDeadlineMissed.Should().BeFalse();
        result.EmailOnResultRecorded.Should().BeTrue();
        result.EmailOnApprovalRequired.Should().BeFalse();
        result.EmailOnNewComment.Should().BeTrue();
        result.EmailOnDocumentUploaded.Should().BeFalse();

        // Assert – entity state updated
        user.NotificationPrefs.EmailOnDeadlineApproaching.Should().BeTrue();
        user.NotificationPrefs.EmailOnDeadlineMissed.Should().BeFalse();
        user.NotificationPrefs.EmailOnResultRecorded.Should().BeTrue();
        user.NotificationPrefs.EmailOnApprovalRequired.Should().BeFalse();
        user.NotificationPrefs.EmailOnNewComment.Should().BeTrue();
        user.NotificationPrefs.EmailOnDocumentUploaded.Should().BeFalse();

        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenAllPreferencesDisabled_ShouldPersistAllFalse()
    {
        // Arrange
        var user = AppUser.CreateFromGoogle("google-notif-2", "notif2@test.com", "Notif User 2", null);
        _currentUserMock.Setup(c => c.UserId).Returns(user.Id);

        var command = new UpdateNotificationPreferencesCommand(
            EmailOnDeadlineApproaching: false,
            EmailOnDeadlineMissed: false,
            EmailOnResultRecorded: false,
            EmailOnApprovalRequired: false,
            EmailOnNewComment: false,
            EmailOnDocumentUploaded: false);

        var mockDbSet = CreateMockDbSet([user]);
        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.EmailOnDeadlineApproaching.Should().BeFalse();
        result.EmailOnDeadlineMissed.Should().BeFalse();
        result.EmailOnResultRecorded.Should().BeFalse();
        result.EmailOnApprovalRequired.Should().BeFalse();
        result.EmailOnNewComment.Should().BeFalse();
        result.EmailOnDocumentUploaded.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());

        var command = new UpdateNotificationPreferencesCommand(true, true, true, true, true, true);

        var mockDbSet = CreateMockDbSet([]);
        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
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
