using FluentAssertions;
using GrantManagement.Application.Common.Behaviours;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Workflow.Commands.ApproveStep;
using GrantManagement.Application.Workflow.Commands.UpdateSubmissionStep;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Common;

// --- Test stubs ---

file sealed record TestAuditableCommand(Guid EntityId) : IRequest<Unit>, IAuditableCommand
{
    public string AuditEntityType => "TestEntity";
    public Guid AuditEntityId => EntityId;
    public AuditAction AuditAction => AuditAction.Update;
}

file sealed record TestAuditableCreateCommand : IRequest<TestCreateResponse>, IAuditableCreateCommand<TestCreateResponse>
{
    public string AuditEntityType => "TestEntity";
    public AuditAction AuditAction => AuditAction.Create;
    public Guid GetEntityId(TestCreateResponse response) => response.Id;
}

file sealed record TestCreateResponse(Guid Id);

file sealed record TestNonAuditableCommand : IRequest<Unit>;

// -------------------------

public class AuditBehaviourTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly Mock<DbSet<AuditLog>> _auditLogSetMock = new();

    private readonly Guid _userId = Guid.NewGuid();
    private const string IpAddress = "127.0.0.1";

    public AuditBehaviourTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(_userId);
        _currentUserMock.Setup(u => u.IpAddress).Returns(IpAddress);
        _contextMock.Setup(c => c.AuditLogs).Returns(_auditLogSetMock.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
    }

    [Fact]
    public async Task Handle_WhenRequestIsIAuditableCommand_ShouldAddAuditLogAndSave()
    {
        // Arrange
        var entityId = Guid.NewGuid();
        var command = new TestAuditableCommand(entityId);
        var behaviour = new AuditBehaviour<TestAuditableCommand, Unit>(_contextMock.Object, _currentUserMock.Object);
        AuditLog? captured = null;
        _auditLogSetMock.Setup(s => s.Add(It.IsAny<AuditLog>()))
            .Callback<AuditLog>(log => captured = log);

        // Act
        await behaviour.Handle(command, () => Task.FromResult(Unit.Value), CancellationToken.None);

        // Assert
        _auditLogSetMock.Verify(s => s.Add(It.IsAny<AuditLog>()), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        captured.Should().NotBeNull();
        captured!.EntityType.Should().Be("TestEntity");
        captured.EntityId.Should().Be(entityId);
        captured.Action.Should().Be(AuditAction.Update);
        captured.UserId.Should().Be(_userId);
        captured.IpAddress.Should().Be(IpAddress);
    }

    [Fact]
    public async Task Handle_WhenRequestIsNotAuditable_ShouldNotAddAuditLogOrSave()
    {
        // Arrange
        var command = new TestNonAuditableCommand();
        var behaviour = new AuditBehaviour<TestNonAuditableCommand, Unit>(_contextMock.Object, _currentUserMock.Object);

        // Act
        await behaviour.Handle(command, () => Task.FromResult(Unit.Value), CancellationToken.None);

        // Assert
        _auditLogSetMock.Verify(s => s.Add(It.IsAny<AuditLog>()), Times.Never);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenRequestIsIAuditableCreateCommand_ShouldExtractEntityIdFromResponse()
    {
        // Arrange
        var responseId = Guid.NewGuid();
        var command = new TestAuditableCreateCommand();
        var behaviour = new AuditBehaviour<TestAuditableCreateCommand, TestCreateResponse>(
            _contextMock.Object, _currentUserMock.Object);
        AuditLog? captured = null;
        _auditLogSetMock.Setup(s => s.Add(It.IsAny<AuditLog>()))
            .Callback<AuditLog>(log => captured = log);

        // Act
        await behaviour.Handle(command, () => Task.FromResult(new TestCreateResponse(responseId)), CancellationToken.None);

        // Assert
        _auditLogSetMock.Verify(s => s.Add(It.IsAny<AuditLog>()), Times.Once);
        captured.Should().NotBeNull();
        captured!.EntityType.Should().Be("TestEntity");
        captured.EntityId.Should().Be(responseId);
        captured.Action.Should().Be(AuditAction.Create);
        captured.UserId.Should().Be(_userId);
    }

    [Fact]
    public void ApproveStepCommand_WhenIsApprovedTrue_ShouldHaveApproveAction()
    {
        var appId = Guid.NewGuid();
        var command = new ApproveStepCommand(appId, WorkflowStepType.Contract, IsApproved: true, RejectionNote: null);
        command.AuditAction.Should().Be(AuditAction.Approve);
    }

    [Fact]
    public void ApproveStepCommand_WhenIsApprovedFalse_ShouldHaveStatusChangeAction()
    {
        var appId = Guid.NewGuid();
        var command = new ApproveStepCommand(appId, WorkflowStepType.Contract, IsApproved: false, RejectionNote: "rejected");
        command.AuditAction.Should().Be(AuditAction.StatusChange);
    }

    [Fact]
    public void UpdateSubmissionStepCommand_ShouldHaveCorrectAuditProperties()
    {
        var appId = Guid.NewGuid();
        var command = new UpdateSubmissionStepCommand(appId, DateTimeOffset.UtcNow, null, null, null);

        command.AuditEntityType.Should().Be("Application");
        command.AuditEntityId.Should().Be(appId);
        command.AuditAction.Should().Be(AuditAction.Update);
    }

    [Fact]
    public async Task Handle_ShouldCallNextBeforeWritingAuditLog()
    {
        // Arrange — verifies that next() is awaited first (response must exist before audit)
        var entityId = Guid.NewGuid();
        var command = new TestAuditableCommand(entityId);
        var behaviour = new AuditBehaviour<TestAuditableCommand, Unit>(_contextMock.Object, _currentUserMock.Object);
        var order = new List<string>();

        _auditLogSetMock.Setup(s => s.Add(It.IsAny<AuditLog>()))
            .Callback<AuditLog>(_ => order.Add("add"));
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("save"))
            .ReturnsAsync(1);

        Task<Unit> Next()
        {
            order.Add("next");
            return Task.FromResult(Unit.Value);
        }

        // Act
        await behaviour.Handle(command, Next, CancellationToken.None);

        // Assert
        order.Should().ContainInOrder("next", "add", "save");
    }
}
