using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Application.Workflow.Commands.ApproveStep;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Workflow;

public class ApproveStepCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly ApproveStepCommandHandler _sut;

    public ApproveStepCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());

        _sut = new ApproveStepCommandHandler(
            _contextMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenApproveSubmission_ShouldReturnApprovedStepDto()
    {
        // Arrange — InProgress application with Submission step Active
        var application = CreateInProgressApplication();
        SetupApplicationsMock([application]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ApproveStepCommand(
            ApplicationId: application.Id,
            StepType: WorkflowStepType.Submission,
            IsApproved: true,
            RejectionNote: null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.StepType.Should().Be(WorkflowStepType.Submission.ToString());
        result.ApprovedAt.Should().NotBeNull();
        application.Status.Should().Be(ApplicationStatus.Submitted);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenRejectSubmission_ShouldSetRejectionNoteAndKeepActive()
    {
        // Arrange
        var application = CreateInProgressApplication();
        var submissionStep = application.WorkflowSteps.First(s => s.StepType == WorkflowStepType.Submission);
        SetupApplicationsMock([application]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ApproveStepCommand(
            ApplicationId: application.Id,
            StepType: WorkflowStepType.Submission,
            IsApproved: false,
            RejectionNote: "Hiányos dokumentumok.");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.RejectionNote.Should().Be("Hiányos dokumentumok.");
        submissionStep.RejectionNote.Should().Be("Hiányos dokumentumok.");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new ApproveStepCommand(
            ApplicationId: Guid.NewGuid(),
            StepType: WorkflowStepType.Submission,
            IsApproved: true,
            RejectionNote: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenApprovingUnsupportedStepType_ShouldThrowDomainException()
    {
        // Arrange — Result step (type 3) is not supported for approval in this handler
        var application = CreateInProgressApplication();
        SetupApplicationsMock([application]);

        var command = new ApproveStepCommand(
            ApplicationId: application.Id,
            StepType: WorkflowStepType.Result,
            IsApproved: true,
            RejectionNote: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateInProgressApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var app = GrantApp.Create("Test Pályázat", Guid.NewGuid(), callData, byUserId);

        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-1),
            SubmittedByUserId = byUserId
        };
        app.RecordSubmission(submissionData, byUserId);

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
