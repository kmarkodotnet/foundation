using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Mappings;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Application.Workflow.Commands.RecordResult;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Workflow;

public class RecordResultCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly IMapper _mapper;
    private readonly RecordResultCommandHandler _sut;

    public RecordResultCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _sut = new RecordResultCommandHandler(
            _contextMock.Object,
            _currentUserMock.Object,
            _mapper);
    }

    [Fact]
    public async Task Handle_WhenIsWon_ShouldSetStatusToWonAndActivateLaterSteps()
    {
        // Arrange — application in Submitted state (Result step Active)
        var application = CreateSubmittedApplication();
        SetupApplicationsMock([application]);
        SetupGrantersMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new RecordResultCommand(
            ApplicationId: application.Id,
            IsWon: true,
            AwardedAmount: 2_000_000m,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: "NYRT-2024");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        application.Status.Should().Be(ApplicationStatus.Won);
        application.WorkflowSteps
            .Where(s => s.StepType is WorkflowStepType.Contract or WorkflowStepType.BudgetPlan)
            .All(s => s.Status == WorkflowStepStatus.Active)
            .Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenIsLost_ShouldSetStatusToLostAndMarkLaterStepsNotApplicable()
    {
        // Arrange
        var application = CreateSubmittedApplication();
        SetupApplicationsMock([application]);
        SetupGrantersMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new RecordResultCommand(
            ApplicationId: application.Id,
            IsWon: false,
            AwardedAmount: null,
            ResultDate: null,
            ResultIdentifier: null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        application.Status.Should().Be(ApplicationStatus.Lost);
        application.WorkflowSteps
            .Where(s => s.StepType is WorkflowStepType.Contract or WorkflowStepType.BudgetPlan)
            .All(s => s.Status == WorkflowStepStatus.NotApplicable)
            .Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new RecordResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: true,
            AwardedAmount: 500_000m,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenResultStepNotActive_ShouldThrowDomainException()
    {
        // Arrange — Draft application: Result step is still Pending
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var draftApp = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
        SetupApplicationsMock([draftApp]);

        var command = new RecordResultCommand(
            ApplicationId: draftApp.Id,
            IsWon: false,
            AwardedAmount: null,
            ResultDate: null,
            ResultIdentifier: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateSubmittedApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var app = GrantApp.Create("Test Pályázat", Guid.NewGuid(), callData, byUserId);

        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-2),
            SubmittedByUserId = byUserId
        };
        app.RecordSubmission(submissionData, byUserId);
        app.ApproveSubmission(byUserId);

        return app;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);
    }

    private void SetupGrantersMock(List<Granter> data)
    {
        _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet(data).Object);
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
