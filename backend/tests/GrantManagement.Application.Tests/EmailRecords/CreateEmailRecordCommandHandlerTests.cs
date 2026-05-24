using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.EmailRecords;

public class CreateEmailRecordCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly CreateEmailRecordCommandHandler _sut;

    public CreateEmailRecordCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _sut = new CreateEmailRecordCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenAppExists_ShouldCreateEmailRecordWithCorrectFields()
    {
        // Arrange
        var app = CreateApplication();
        SetupApplicationsMock([app]);
        _contextMock.Setup(c => c.EmailRecords).Returns(CreateMockDbSet<EmailRecord>([]).Object);
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet<AppUser>([]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var sentDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var command = new CreateEmailRecordCommand
        {
            ApplicationId = app.Id,
            Subject = "Pályázat eredményéről értesítés",
            SenderEmail = "palyaztato@example.hu",
            SentDate = sentDate,
            Direction = "In",
            ContentSummary = "Nyert pályázatról tájékoztatás."
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.ApplicationId.Should().Be(app.Id);
        result.Subject.Should().Be("Pályázat eredményéről értesítés");
        result.SenderEmail.Should().Be("palyaztato@example.hu");
        result.SentDate.Should().Be(sentDate);
        result.Direction.Should().Be("In");
        result.HasAttachment.Should().BeFalse();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenAppNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new CreateEmailRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            Subject = "Tárgy",
            SenderEmail = "a@b.com",
            SentDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Direction = "Out"
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    // --- helpers ---

    private static GrantApp CreateApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        return GrantApp.Create("Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
    }

    private void SetupApplicationsMock(List<GrantApp> data)
        => _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);

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
