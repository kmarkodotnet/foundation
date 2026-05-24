using FluentAssertions;
using GrantManagement.Application.BudgetPlan.Commands.RequestBudgetPlanApproval;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.BudgetPlan;

public class RequestBudgetPlanApprovalCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly RequestBudgetPlanApprovalCommandHandler _sut;

    public RequestBudgetPlanApprovalCommandHandlerTests()
    {
        _sut = new RequestBudgetPlanApprovalCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenBudgetPlanHasItems_ShouldSendNotificationsToElnokUsers()
    {
        // Arrange
        var application = CreateWonApplicationWithBudgetPlan();
        SetupApplicationsMock([application]);

        var elnokUser = AppUser.CreateFromGoogle("g-id", "elnok@test.com", "Elnök", null, UserRole.Elnok);
        SetupAppUsersMock([elnokUser]);
        SetupNotificationsMock();
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(
            new RequestBudgetPlanApprovalCommand(application.Id), CancellationToken.None);

        // Assert
        result.Should().Be(Unit.Value);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenNoBudgetPlan_ShouldThrowDomainException()
    {
        // Arrange — Won application without budget plan
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

        SetupApplicationsMock([app]);

        // Act
        Func<Task> act = () => _sut.Handle(
            new RequestBudgetPlanApprovalCommand(app.Id), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*nincs*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenBudgetPlanHasNoItems_ShouldThrowDomainException()
    {
        // Arrange — Won application with empty budget plan
        var application = CreateWonApplicationWithEmptyBudgetPlan();
        SetupApplicationsMock([application]);

        // Act
        Func<Task> act = () => _sut.Handle(
            new RequestBudgetPlanApprovalCommand(application.Id), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*tétel*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        // Act
        Func<Task> act = () => _sut.Handle(
            new RequestBudgetPlanApprovalCommand(Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateWonApplicationWithBudgetPlan()
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

        app.CreateBudgetPlan();
        app.BudgetPlan!.AddItem("Laptop", BudgetItemType.Asset, 500_000m, null, 1);

        return app;
    }

    private static GrantApp CreateWonApplicationWithEmptyBudgetPlan()
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

        app.CreateBudgetPlan();

        return app;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);
    }

    private void SetupAppUsersMock(List<AppUser> data)
    {
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet(data).Object);
    }

    private void SetupNotificationsMock()
    {
        _contextMock.Setup(c => c.Notifications).Returns(CreateMockDbSet<Notification>([]).Object);
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
