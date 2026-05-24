using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Auth.DTOs;
using GrantManagement.Application.Auth.Queries.GetCurrentUser;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Mappings;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Auth;

public class GetCurrentUserQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly IMapper _mapper;
    private readonly GetCurrentUserQueryHandler _sut;

    public GetCurrentUserQueryHandlerTests()
    {
        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _sut = new GetCurrentUserQueryHandler(_contextMock.Object, _currentUserMock.Object, _mapper);
    }

    [Fact]
    public async Task Handle_WhenUserExists_ShouldReturnUserProfileDto()
    {
        // Arrange
        var user = AppUser.CreateFromGoogle(
            "google-me-123",
            "profile@test.com",
            "Profile User",
            "https://pic.jpg",
            UserRole.PalyazatiMunkatars);

        _currentUserMock.Setup(c => c.UserId).Returns(user.Id);

        var mockDbSet = CreateMockDbSet([user]);
        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);

        // Act
        var result = await _sut.Handle(new GetCurrentUserQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(user.Id);
        result.Email.Should().Be("profile@test.com");
        result.FullName.Should().Be("Profile User");
        result.PictureUrl.Should().Be("https://pic.jpg");
        result.Role.Should().Be("PalyazatiMunkatars");
        result.NotificationPreferences.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WhenUserExists_ShouldReturnCorrectNotificationPreferences()
    {
        // Arrange
        var user = AppUser.CreateFromGoogle("google-prefs-123", "prefs@test.com", "Prefs User", null);
        _currentUserMock.Setup(c => c.UserId).Returns(user.Id);

        var mockDbSet = CreateMockDbSet([user]);
        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);

        // Act
        var result = await _sut.Handle(new GetCurrentUserQuery(), CancellationToken.None);

        // Assert — default NotificationPreferences values
        result.NotificationPreferences.EmailOnDeadlineApproaching.Should().BeTrue();
        result.NotificationPreferences.EmailOnDeadlineMissed.Should().BeTrue();
        result.NotificationPreferences.EmailOnResultRecorded.Should().BeTrue();
        result.NotificationPreferences.EmailOnApprovalRequired.Should().BeTrue();
        result.NotificationPreferences.EmailOnNewComment.Should().BeFalse();
        result.NotificationPreferences.EmailOnDocumentUploaded.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var unknownId = Guid.NewGuid();
        _currentUserMock.Setup(c => c.UserId).Returns(unknownId);

        var mockDbSet = CreateMockDbSet([]);
        _contextMock.Setup(c => c.AppUsers).Returns(mockDbSet.Object);

        // Act
        Func<Task> act = () => _sut.Handle(new GetCurrentUserQuery(), CancellationToken.None);

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
