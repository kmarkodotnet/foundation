using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.Commands.DeleteEmailRecord;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.EmailRecords;

public class DeleteEmailRecordCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly DeleteEmailRecordCommandHandler _sut;
    private readonly Guid _currentUserId = Guid.NewGuid();

    public DeleteEmailRecordCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(_currentUserId);
        _currentUserMock.Setup(u => u.Role).Returns(UserRole.PalyazatiMunkatars);
        _sut = new DeleteEmailRecordCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCalledByCreator_ShouldSoftDelete()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var record = EmailRecord.Create(
            applicationId, "Tárgy", "sender@example.com",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            EmailDirection.In, _currentUserId);

        SetupEmailRecordsMock([record]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new DeleteEmailRecordCommand(applicationId, record.Id);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        record.IsDeleted.Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCalledByNonCreatorNonAdmin_ShouldThrowForbiddenException()
    {
        // Arrange — record owned by someone else; current user is not Admin
        var applicationId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var record = EmailRecord.Create(
            applicationId, "Tárgy", "sender@example.com",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            EmailDirection.In, otherUserId);

        SetupEmailRecordsMock([record]);

        var command = new DeleteEmailRecordCommand(applicationId, record.Id);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenRecordNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupEmailRecordsMock([]);

        var command = new DeleteEmailRecordCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    private void SetupEmailRecordsMock(List<EmailRecord> data)
        => _contextMock.Setup(c => c.EmailRecords).Returns(CreateMockDbSet(data).Object);

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
