using FluentAssertions;
using GrantManagement.Application.Comments.Commands.DeleteComment;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Comments;

public class DeleteCommentCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly DeleteCommentCommandHandler _sut;
    private readonly Guid _currentUserId = Guid.NewGuid();

    public DeleteCommentCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(_currentUserId);
        _currentUserMock.Setup(u => u.Role).Returns(UserRole.PalyazatiMunkatars);
        _sut = new DeleteCommentCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCalledByAuthor_ShouldSoftDeleteComment()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var comment = Comment.Create(applicationId, "Eredeti szöveg.", _currentUserId);

        _contextMock.Setup(c => c.Comments).Returns(CreateMockDbSet([comment]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new DeleteCommentCommand(applicationId, comment.Id);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        comment.IsDeleted.Should().BeTrue();
        comment.Body.Should().Be("[Megjegyzés törölve]");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCalledByNonAuthorNonAdmin_ShouldThrowForbiddenException()
    {
        // Arrange — comment belongs to someone else; current user is not Admin
        var applicationId = Guid.NewGuid();
        var comment = Comment.Create(applicationId, "Eredeti szöveg.", Guid.NewGuid());

        _contextMock.Setup(c => c.Comments).Returns(CreateMockDbSet([comment]).Object);

        var command = new DeleteCommentCommand(applicationId, comment.Id);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenCommentNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Comments).Returns(CreateMockDbSet<Comment>([]).Object);

        var command = new DeleteCommentCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
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
