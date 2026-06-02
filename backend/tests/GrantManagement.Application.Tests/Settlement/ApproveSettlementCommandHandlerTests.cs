using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Settlement.Commands.ApproveSettlement;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Settlement;

public class ApproveSettlementCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly ApproveSettlementCommandHandler _sut;
    private readonly Guid _currentUserId = Guid.NewGuid();

    public ApproveSettlementCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(_currentUserId);
        _mapperMock
            .Setup(m => m.Map<ApplicationDetailDto>(
                It.IsAny<object>(),
                It.IsAny<Action<IMappingOperationOptions>>()))
            .Returns(new ApplicationDetailDto { Status = ApplicationStatus.ClosedWon });

        _sut = new ApproveSettlementCommandHandler(
            _contextMock.Object, _currentUserMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task Handle_WhenApproved_ShouldCloseApplicationAndLockAllSteps()
    {
        // Arrange
        var app = CreateWonApplicationWithSettlement();
        SetupApplicationsMock([app]);
        SetupGrantersMock([]);
        SetupAppUsersMock([]);
        SetupCodeListItemsMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ApproveSettlementCommand
        {
            ApplicationId = app.Id,
            IsApproved = true
        };

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert — domain state
        app.Status.Should().Be(ApplicationStatus.ClosedWon);
        app.WorkflowSteps.Should().AllSatisfy(s =>
            s.Status.Should().Be(WorkflowStepStatus.Locked));
        app.Settlement!.ApprovedByUserId.Should().Be(_currentUserId);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenRejected_ShouldStoreRejectionNoteOnSettlementStep()
    {
        // Arrange
        var app = CreateWonApplication();
        SetupApplicationsMock([app]);
        SetupGrantersMock([]);
        SetupAppUsersMock([]);
        SetupCodeListItemsMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ApproveSettlementCommand
        {
            ApplicationId = app.Id,
            IsApproved = false,
            RejectionNote = "Hiányos dokumentáció."
        };

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        var settlementStep = app.WorkflowSteps
            .Single(s => s.StepType == WorkflowStepType.Settlement);
        settlementStep.RejectionNote.Should().Be("Hiányos dokumentáció.");
        app.Status.Should().Be(ApplicationStatus.Won);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenAppNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new ApproveSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            IsApproved = true
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
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
            new Money(2_000_000m, "HUF"), null), byUserId);
        return app;
    }

    private static GrantApp CreateWonApplicationWithSettlement()
    {
        var app = CreateWonApplication();
        var p = new SettlementParams { SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow) };
        app.RecordSettlement(p, Guid.NewGuid());
        return app;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
        => _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);

    private void SetupGrantersMock(List<Granter> data)
        => _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet(data).Object);

    private void SetupAppUsersMock(List<AppUser> data)
        => _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet(data).Object);

    private void SetupCodeListItemsMock(List<CodeListItem> data)
        => _contextMock.Setup(c => c.CodeListItems).Returns(CreateMockDbSet(data).Object);

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
