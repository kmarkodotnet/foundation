using FluentAssertions;
using GrantManagement.Application.Comments.Commands.AddComment;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Comments;

public class AddCommentCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly AddCommentCommandHandler _sut;
    private readonly Guid _currentUserId = Guid.NewGuid();

    public AddCommentCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(_currentUserId);
        _sut = new AddCommentCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldCreateCommentWithCorrectBodyAndAuthor()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        _contextMock.Setup(c => c.Comments).Returns(CreateMockDbSet<Comment>([]).Object);
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet<AppUser>([]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new AddCommentCommand
        {
            ApplicationId = applicationId,
            Body = "A beadási határidőt meg kell erősíteni."
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.ApplicationId.Should().Be(applicationId);
        result.Body.Should().Be("A beadási határidőt meg kell erősíteni.");
        result.AuthorId.Should().Be(_currentUserId);
        result.IsDeleted.Should().BeFalse();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static Mock<DbSet<T>> CreateMockDbSet<T>(List<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var mock = new Mock<DbSet<T>>();
        mock.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<T>(data.GetEnumerator()));
        mock.As<IQueryable<T>>()
            .Setup(m => m.Provider)
            .Returns(new TestAsyncQueryProvider<T>(queryable.Provider));
        mock.As<IQueryable<T>>().Setup(m => m.Expression).Returns(queryable.Expression);
        mock.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        mock.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(queryable.GetEnumerator());
        return mock;
    }
}
