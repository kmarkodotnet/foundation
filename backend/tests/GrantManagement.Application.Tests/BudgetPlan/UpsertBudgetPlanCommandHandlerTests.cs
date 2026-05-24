using FluentAssertions;
using GrantManagement.Application.BudgetPlan.Commands.UpsertBudgetPlan;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;
using BudgetPlanEntity = GrantManagement.Domain.Entities.BudgetPlan;

namespace GrantManagement.Application.Tests.BudgetPlan;

public class UpsertBudgetPlanCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly UpsertBudgetPlanCommandHandler _sut;

    public UpsertBudgetPlanCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        _sut = new UpsertBudgetPlanCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenWonApplicationAndNoBudgetPlan_ShouldCreatePlanWithItems()
    {
        // Arrange
        var application = CreateWonApplication();
        SetupApplicationsMock([application]);
        SetupBudgetPlansMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UpsertBudgetPlanCommand(
            ApplicationId: application.Id,
            Notes: "Éves rendezvény",
            Items:
            [
                new UpsertBudgetItemDto(null, "Nyári tábor", BudgetItemType.Event, 500_000m, null, 1),
                new UpsertBudgetItemDto(null, "Laptop", BudgetItemType.Asset, 350_000m, "Dell XPS", 2)
            ]);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.TotalPlanned.Should().Be(850_000m);
        result.Notes.Should().Be("Éves rendezvény");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenWon_ShouldComputeDifferenceCorrectly()
    {
        // Arrange — application won with 1_000_000 HUF; plan total = 850_000 → difference = 150_000
        var application = CreateWonApplicationWithAward(1_000_000m);
        SetupApplicationsMock([application]);
        SetupBudgetPlansMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UpsertBudgetPlanCommand(
            ApplicationId: application.Id,
            Notes: null,
            Items:
            [
                new UpsertBudgetItemDto(null, "Rendezvény", BudgetItemType.Event, 850_000m, null, 1)
            ]);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.AwardedAmount.Should().Be(1_000_000m);
        result.TotalPlanned.Should().Be(850_000m);
        result.Difference.Should().Be(150_000m);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotWon_ShouldThrowDomainException()
    {
        // Arrange — Draft application cannot have a budget plan
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var draftApp = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
        SetupApplicationsMock([draftApp]);

        var command = new UpsertBudgetPlanCommand(
            ApplicationId: draftApp.Id,
            Notes: null,
            Items: [new UpsertBudgetItemDto(null, "Tétel", BudgetItemType.Other, 100_000m, null, 1)]);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*nyert*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new UpsertBudgetPlanCommand(
            ApplicationId: Guid.NewGuid(),
            Notes: null,
            Items: []);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateWonApplication() => CreateWonApplicationWithAward(2_000_000m);

    private static GrantApp CreateWonApplicationWithAward(decimal awardedAmount)
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
            new Money(awardedAmount, "HUF"),
            null), byUserId);

        return app;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);
    }

    private void SetupBudgetPlansMock(List<BudgetPlanEntity> data)
    {
        _contextMock.Setup(c => c.BudgetPlans).Returns(CreateMockDbSet(data).Object);
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
