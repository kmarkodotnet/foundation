using FluentAssertions;
using GrantManagement.Application.Applications.Commands.ArchiveApplication;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Applications;

public class ArchiveApplicationCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly ArchiveApplicationCommandHandler _sut;

    public ArchiveApplicationCommandHandlerTests()
    {
        _sut = new ArchiveApplicationCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenApplicationIsClosedLost_ShouldSetArchivedStatus()
    {
        // Arrange
        var application = CreateClosedLostApplication();
        SetupApplicationsMock([application]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(new ArchiveApplicationCommand(application.Id), CancellationToken.None);

        // Assert
        result.Should().Be(Unit.Value);
        application.Status.Should().Be(ApplicationStatus.Archived);
        application.IsArchived.Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        // Act
        Func<Task> act = () => _sut.Handle(new ArchiveApplicationCommand(Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenApplicationIsDraft_ShouldThrowDomainException()
    {
        // Arrange — Draft application cannot be archived
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var draftApp = GrantApp.Create("Teszt", Guid.NewGuid(), callData, Guid.NewGuid());
        SetupApplicationsMock([draftApp]);

        // Act
        Func<Task> act = () => _sut.Handle(new ArchiveApplicationCommand(draftApp.Id), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateClosedLostApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var app = GrantApp.Create("Archivált pályázat", Guid.NewGuid(), callData, byUserId);

        var submissionData = new SubmissionStepData { SubmittedAt = DateTimeOffset.UtcNow, SubmittedByUserId = byUserId };
        app.RecordSubmission(submissionData, byUserId);
        app.ApproveSubmission(byUserId);
        app.RecordResult(ApplicationResult.Lost(DateOnly.FromDateTime(DateTime.UtcNow)), byUserId);
        app.ManualClose();

        return app;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);
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
