using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Application.Workflow.Commands.UpdateSubmissionStep;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Workflow;

public class UpdateSubmissionStepCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly UpdateSubmissionStepCommandHandler _sut;

    public UpdateSubmissionStepCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());

        _sut = new UpdateSubmissionStepCommandHandler(
            _contextMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenSubmissionStepIsActive_ShouldSetApplicationToInProgress()
    {
        // Arrange — fresh application: Submission step is Active
        var application = CreateDraftApplication();
        SetupApplicationsMock([application]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UpdateSubmissionStepCommand(
            ApplicationId: application.Id,
            SubmittedAt: DateTimeOffset.UtcNow.AddHours(-1),
            SubmissionMethodId: null,
            ExternalIdentifier: null,
            Notes: null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        application.Status.Should().Be(ApplicationStatus.InProgress);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenSubmissionStepIsActive_ShouldReturnWorkflowStepDetailDto()
    {
        // Arrange
        var application = CreateDraftApplication();
        SetupApplicationsMock([application]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var submittedAt = DateTimeOffset.UtcNow.AddHours(-1);
        var command = new UpdateSubmissionStepCommand(
            ApplicationId: application.Id,
            SubmittedAt: submittedAt,
            SubmissionMethodId: null,
            ExternalIdentifier: "REF-001",
            Notes: "Postán beadva");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.StepType.Should().Be(WorkflowStepType.Submission.ToString());
        result.SubmittedAt.Should().Be(submittedAt);
        result.ExternalIdentifier.Should().Be("REF-001");
        result.Notes.Should().Be("Postán beadva");
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new UpdateSubmissionStepCommand(
            ApplicationId: Guid.NewGuid(),
            SubmittedAt: DateTimeOffset.UtcNow.AddHours(-1),
            SubmissionMethodId: null,
            ExternalIdentifier: null,
            Notes: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenSubmissionStepNotActive_ShouldThrowDomainException()
    {
        // Arrange — advance past submission step so it's no longer Active
        var application = CreateDraftApplication();
        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-1),
            SubmittedByUserId = Guid.NewGuid()
        };
        application.RecordSubmission(submissionData, Guid.NewGuid()); // status: InProgress, step: still Active
        application.ApproveSubmission(Guid.NewGuid()); // step: Completed → no longer Active

        SetupApplicationsMock([application]);

        var command = new UpdateSubmissionStepCommand(
            ApplicationId: application.Id,
            SubmittedAt: DateTimeOffset.UtcNow.AddHours(-1),
            SubmissionMethodId: null,
            ExternalIdentifier: null,
            Notes: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*szerkeszthető*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateDraftApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        return GrantApp.Create("Test Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
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
