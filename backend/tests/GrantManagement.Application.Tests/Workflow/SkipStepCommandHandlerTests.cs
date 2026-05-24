using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Application.Workflow.Commands.SkipStep;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Workflow;

public class SkipStepCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly SkipStepCommandHandler _sut;

    public SkipStepCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        _sut = new SkipStepCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenSkippableStepOnWonApplication_ShouldSetStatusSkipped()
    {
        // Arrange — Won application: Contract step (skippable) is Active
        var application = CreateWonApplication();
        SetupApplicationsMock([application]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new SkipStepCommand(
            ApplicationId: application.Id,
            StepType: WorkflowStepType.Contract,
            SkipReason: "Nem kötnek formális szerződést.");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.StepType.Should().Be(WorkflowStepType.Contract.ToString());
        result.Status.Should().Be(WorkflowStepStatus.Skipped.ToString());
        result.SkippedReason.Should().Be("Nem kötnek formális szerződést.");
        var contractStep = application.WorkflowSteps.First(s => s.StepType == WorkflowStepType.Contract);
        contractStep.Status.Should().Be(WorkflowStepStatus.Skipped);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenNonSkippableStep_ShouldThrowDomainException()
    {
        // Arrange — Submission step is not skippable
        var application = CreateWonApplication();
        SetupApplicationsMock([application]);

        var command = new SkipStepCommand(
            ApplicationId: application.Id,
            StepType: WorkflowStepType.Submission,
            SkipReason: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*nem hagyható ki*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new SkipStepCommand(
            ApplicationId: Guid.NewGuid(),
            StepType: WorkflowStepType.Contract,
            SkipReason: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateWonApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var app = GrantApp.Create("Nyertes Pályázat", Guid.NewGuid(), callData, byUserId);

        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-3),
            SubmittedByUserId = byUserId
        };
        app.RecordSubmission(submissionData, byUserId);
        app.ApproveSubmission(byUserId);
        app.RecordResult(ApplicationResult.Won(
            DateOnly.FromDateTime(DateTime.UtcNow),
            new Money(1_000_000m, "HUF"),
            null), byUserId);

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
