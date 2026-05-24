using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Settlement.Commands.RecordSettlement;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;
using SettlementEntity = GrantManagement.Domain.Entities.Settlement;

namespace GrantManagement.Application.Tests.Settlement;

public class RecordSettlementCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly RecordSettlementCommandHandler _sut;

    public RecordSettlementCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _sut = new RecordSettlementCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCoverageAtOrAbove80Percent_ShouldReturnNoWarning()
    {
        // Arrange — awarded 2_000_000; invoiced 1_600_000 → coverage 80% → no warning
        var app = CreateWonApplication(awardedAmount: 2_000_000m);
        var invoice = CreateInvoice(app.Id, 1_600_000m);

        SetupApplicationsMock([app]);
        SetupInvoicesMock([invoice]);
        SetupSettlementsMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new RecordSettlementCommand
        {
            ApplicationId = app.Id,
            SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.HasLowCoverageWarning.Should().BeFalse();
        result.InvoiceCoveragePercent.Should().Be(80m);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCoverageBelow80Percent_ShouldReturnWarning()
    {
        // Arrange — awarded 2_000_000; invoiced 1_000_000 → coverage 50% → warning
        var app = CreateWonApplication(awardedAmount: 2_000_000m);
        var invoice = CreateInvoice(app.Id, 1_000_000m);

        SetupApplicationsMock([app]);
        SetupInvoicesMock([invoice]);
        SetupSettlementsMock([]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new RecordSettlementCommand
        {
            ApplicationId = app.Id,
            SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.HasLowCoverageWarning.Should().BeTrue();
        result.InvoiceCoveragePercent.Should().Be(50m);
    }

    [Fact]
    public async Task Handle_WhenAppNotWon_ShouldThrowDomainException()
    {
        // Arrange — application in initial state
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var app = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
        SetupApplicationsMock([app]);

        var command = new RecordSettlementCommand
        {
            ApplicationId = app.Id,
            SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*nyert*");
    }

    [Fact]
    public async Task Handle_WhenAppNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new RecordSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    // --- helpers ---

    private static GrantApp CreateWonApplication(decimal awardedAmount)
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
            new Money(awardedAmount, "HUF"), null), byUserId);
        return app;
    }

    private static Invoice CreateInvoice(Guid applicationId, decimal amount)
        => Invoice.Create(applicationId, "Acme Kft.", "SZ-001",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            amount, isPaid: false, paymentDate: null, createdByUserId: Guid.NewGuid());

    private void SetupApplicationsMock(List<GrantApp> data)
        => _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);

    private void SetupInvoicesMock(List<Invoice> data)
        => _contextMock.Setup(c => c.Invoices).Returns(CreateMockDbSet(data).Object);

    private void SetupSettlementsMock(List<SettlementEntity> data)
        => _contextMock.Setup(c => c.Settlements).Returns(CreateMockDbSet(data).Object);

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
