using FluentAssertions;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Behaviours;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Common;

// --- Test stubs ---

[RequireRole(UserRole.Admin)]
file sealed record TestAdminCommand : IRequest<Unit>;

file sealed record TestApplicationCommand(Guid ApplicationId)
    : IRequest<Unit>, IApplicationCommand;

file sealed record TestPlainCommand : IRequest<Unit>;

// -------------------------

public class AuthorizationBehaviourTests
{
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly Mock<IApplicationDbContext> _contextMock = new();

    // Helper: creates a locked Application (ClosedLost status)
    private static GrantApp CreateLockedApplication()
    {
        var callData = new CallStepData
        {
            SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30)
        };
        var app = GrantApp.Create(
            title: "Test Pályázat",
            granterId: Guid.NewGuid(),
            callData: callData,
            createdByUserId: Guid.NewGuid());

        // Move to InProgress
        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow,
            SubmittedByUserId = Guid.NewGuid()
        };
        app.RecordSubmission(submissionData, Guid.NewGuid());

        // Record a Lost result
        var lostResult = ApplicationResult.Lost(DateOnly.FromDateTime(DateTime.UtcNow));
        app.RecordResult(lostResult, Guid.NewGuid());

        // ManualClose → ClosedLost → IsLocked = true
        app.ManualClose();

        return app;
    }

    private static Mock<DbSet<GrantApp>> CreateMockDbSet(List<GrantApp> data)
    {
        var queryable = data.AsQueryable();
        var mockDbSet = new Mock<DbSet<GrantApp>>();

        mockDbSet.As<IAsyncEnumerable<GrantApp>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<GrantApp>(data.GetEnumerator()));

        mockDbSet.As<IQueryable<GrantApp>>()
            .Setup(m => m.Provider)
            .Returns(new TestAsyncQueryProvider<GrantApp>(queryable.Provider));

        mockDbSet.As<IQueryable<GrantApp>>().Setup(m => m.Expression).Returns(queryable.Expression);
        mockDbSet.As<IQueryable<GrantApp>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        mockDbSet.As<IQueryable<GrantApp>>().Setup(m => m.GetEnumerator()).Returns(queryable.GetEnumerator());

        return mockDbSet;
    }

    [Fact]
    public async Task Handle_WhenCommandHasRequireRoleAndUserHasCorrectRole_ShouldCallNext()
    {
        // Arrange
        _currentUserMock.Setup(c => c.Role).Returns(UserRole.Admin);

        var behaviour = new AuthorizationBehaviour<TestAdminCommand, Unit>(
            _currentUserMock.Object,
            _contextMock.Object);

        var nextCalled = false;
        Task<Unit> Next() { nextCalled = true; return Task.FromResult(Unit.Value); }

        // Act
        var result = await behaviour.Handle(new TestAdminCommand(), Next, CancellationToken.None);

        // Assert
        nextCalled.Should().BeTrue();
        result.Should().Be(Unit.Value);
    }

    [Fact]
    public async Task Handle_WhenCommandHasRequireRoleAndUserHasWrongRole_ShouldThrowForbiddenException()
    {
        // Arrange
        _currentUserMock.Setup(c => c.Role).Returns(UserRole.Megtekinto);

        var behaviour = new AuthorizationBehaviour<TestAdminCommand, Unit>(
            _currentUserMock.Object,
            _contextMock.Object);

        var nextCalled = false;
        Task<Unit> Next() { nextCalled = true; return Task.FromResult(Unit.Value); }

        // Act
        Func<Task> act = () => behaviour.Handle(new TestAdminCommand(), Next, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
        nextCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenCommandIsIApplicationCommandAndApplicationLocked_NonAdmin_ShouldThrowForbiddenException()
    {
        // Arrange
        _currentUserMock.Setup(c => c.Role).Returns(UserRole.PalyazatiMunkatars);

        var lockedApp = CreateLockedApplication();
        var apps = new List<GrantApp> { lockedApp };
        var mockDbSet = CreateMockDbSet(apps);
        _contextMock.Setup(c => c.Applications).Returns(mockDbSet.Object);

        var behaviour = new AuthorizationBehaviour<TestApplicationCommand, Unit>(
            _currentUserMock.Object,
            _contextMock.Object);

        var command = new TestApplicationCommand(lockedApp.Id);
        var nextCalled = false;
        Task<Unit> Next() { nextCalled = true; return Task.FromResult(Unit.Value); }

        // Act
        Func<Task> act = () => behaviour.Handle(command, Next, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
        nextCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenCommandIsIApplicationCommandAndApplicationLocked_Admin_ShouldCallNext()
    {
        // Arrange
        _currentUserMock.Setup(c => c.Role).Returns(UserRole.Admin);

        var lockedApp = CreateLockedApplication();
        var apps = new List<GrantApp> { lockedApp };
        var mockDbSet = CreateMockDbSet(apps);
        _contextMock.Setup(c => c.Applications).Returns(mockDbSet.Object);

        var behaviour = new AuthorizationBehaviour<TestApplicationCommand, Unit>(
            _currentUserMock.Object,
            _contextMock.Object);

        var command = new TestApplicationCommand(lockedApp.Id);
        var nextCalled = false;
        Task<Unit> Next() { nextCalled = true; return Task.FromResult(Unit.Value); }

        // Act
        var result = await behaviour.Handle(command, Next, CancellationToken.None);

        // Assert
        nextCalled.Should().BeTrue();
        result.Should().Be(Unit.Value);
    }

    [Fact]
    public async Task Handle_WhenCommandHasNoAttributeAndNoIApplicationCommand_ShouldCallNext()
    {
        // Arrange
        _currentUserMock.Setup(c => c.Role).Returns(UserRole.Megtekinto);

        var behaviour = new AuthorizationBehaviour<TestPlainCommand, Unit>(
            _currentUserMock.Object,
            _contextMock.Object);

        var nextCalled = false;
        Task<Unit> Next() { nextCalled = true; return Task.FromResult(Unit.Value); }

        // Act
        var result = await behaviour.Handle(new TestPlainCommand(), Next, CancellationToken.None);

        // Assert
        nextCalled.Should().BeTrue();
        result.Should().Be(Unit.Value);
    }
}
