using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Mappings;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Application.Workflow.Commands.CorrectResult;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Workflow;

public class CorrectResultCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly IMapper _mapper;
    private readonly CorrectResultCommandHandler _sut;

    public CorrectResultCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _sut = new CorrectResultCommandHandler(
            _contextMock.Object,
            _currentUserMock.Object,
            _mapper);
    }

    [Fact]
    public async Task Handle_WhenWonCorrectedToLost_ShouldSetStatusToLost()
    {
        // Arrange — application currently Won
        var application = CreateWonApplication();
        SetupApplicationsMock([application]);
        SetupGrantersMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CorrectResultCommand(
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
    public async Task Handle_WhenLostCorrectedToWon_ShouldSetStatusToWon()
    {
        // Arrange — application currently Lost
        var application = CreateLostApplication();
        SetupApplicationsMock([application]);
        SetupGrantersMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CorrectResultCommand(
            ApplicationId: application.Id,
            IsWon: true,
            AwardedAmount: 1_500_000m,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        application.Status.Should().Be(ApplicationStatus.Won);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new CorrectResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: false,
            AwardedAmount: null,
            ResultDate: null,
            ResultIdentifier: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenApplicationIsClosed_ShouldThrowDomainException()
    {
        // Arrange — ClosedLost application cannot have result corrected
        var application = CreateClosedLostApplication();
        SetupApplicationsMock([application]);

        var command = new CorrectResultCommand(
            ApplicationId: application.Id,
            IsWon: true,
            AwardedAmount: 1_000_000m,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*archivált*");
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

    private static GrantApp CreateLostApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var app = GrantApp.Create("Vesztes Pályázat", Guid.NewGuid(), callData, byUserId);

        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-3),
            SubmittedByUserId = byUserId
        };
        app.RecordSubmission(submissionData, byUserId);
        app.ApproveSubmission(byUserId);
        app.RecordResult(ApplicationResult.Lost(DateOnly.FromDateTime(DateTime.UtcNow)), byUserId);

        return app;
    }

    private static GrantApp CreateClosedLostApplication()
    {
        var app = CreateLostApplication();
        app.ManualClose();
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
