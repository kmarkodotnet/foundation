using FluentAssertions;
using GrantManagement.Application.BudgetPlan.Queries.GetBudgetPlan;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.BudgetPlan;

public class GetBudgetPlanQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly GetBudgetPlanQueryHandler _sut;

    public GetBudgetPlanQueryHandlerTests()
    {
        _sut = new GetBudgetPlanQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenBudgetPlanExists_ShouldReturnDtoWithCorrectDifference()
    {
        // Arrange — Won with 1_000_000 award, plan total = 600_000, difference = 400_000
        var application = CreateWonApplicationWithBudgetPlan(awardedAmount: 1_000_000m, itemAmount: 600_000m);
        SetupApplicationsMock([application]);

        // Act
        var result = await _sut.Handle(new GetBudgetPlanQuery(application.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.TotalPlanned.Should().Be(600_000m);
        result.AwardedAmount.Should().Be(1_000_000m);
        result.Difference.Should().Be(400_000m);
        result.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_WhenNoBudgetPlan_ShouldReturnNull()
    {
        // Arrange — Won application without a budget plan
        var application = CreateWonApplicationNoBudgetPlan();
        SetupApplicationsMock([application]);

        // Act
        var result = await _sut.Handle(new GetBudgetPlanQuery(application.Id), CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        // Act
        Func<Task> act = () => _sut.Handle(new GetBudgetPlanQuery(Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    // --- helpers ---

    private static GrantApp CreateWonApplicationNoBudgetPlan()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var app = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, byUserId);

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

    private static GrantApp CreateWonApplicationWithBudgetPlan(decimal awardedAmount, decimal itemAmount)
    {
        var app = CreateWonApplicationNoBudgetPlan();

        // Override the result to have the correct awarded amount
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var freshApp = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, byUserId);

        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-3),
            SubmittedByUserId = byUserId
        };
        freshApp.RecordSubmission(submissionData, byUserId);
        freshApp.ApproveSubmission(byUserId);
        freshApp.RecordResult(ApplicationResult.Won(
            DateOnly.FromDateTime(DateTime.UtcNow),
            new Money(awardedAmount, "HUF"),
            null), byUserId);

        freshApp.CreateBudgetPlan();
        freshApp.BudgetPlan!.AddItem("Tétel", BudgetItemType.Event, itemAmount, null, 1);

        return freshApp;
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
