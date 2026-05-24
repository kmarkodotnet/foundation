using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.Commands.CreateInvoice;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Invoices;

public class CreateInvoiceCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly CreateInvoiceCommandHandler _sut;

    public CreateInvoiceCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        _sut = new CreateInvoiceCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenWonApplication_ShouldCreateInvoiceWithCorrectFields()
    {
        // Arrange
        var application = CreateWonApplication();
        SetupApplicationsMock([application]);
        SetupInvoicesMock();
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var issueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5));
        var command = new CreateInvoiceCommand(
            ApplicationId: application.Id,
            SupplierName: "Acme Kft.",
            InvoiceNumber: "SZ-2025-001",
            IssueDate: issueDate,
            Amount: 125_000m,
            IsPaid: false,
            PaymentDate: null,
            VendorContractId: null,
            BudgetItemId: null,
            Notes: "Megjegyzés");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.SupplierName.Should().Be("Acme Kft.");
        result.InvoiceNumber.Should().Be("SZ-2025-001");
        result.Amount.Should().Be(125_000m);
        result.IsPaid.Should().BeFalse();
        result.IssueDate.Should().Be(issueDate);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotWon_ShouldThrowDomainException()
    {
        // Arrange
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var draftApp = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
        SetupApplicationsMock([draftApp]);

        var command = new CreateInvoiceCommand(
            ApplicationId: draftApp.Id,
            SupplierName: "Acme Kft.",
            InvoiceNumber: "SZ-001",
            IssueDate: DateOnly.FromDateTime(DateTime.UtcNow),
            Amount: 100_000m,
            IsPaid: false,
            PaymentDate: null,
            VendorContractId: null,
            BudgetItemId: null,
            Notes: null);

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

        var command = new CreateInvoiceCommand(
            ApplicationId: Guid.NewGuid(),
            SupplierName: "Acme Kft.",
            InvoiceNumber: "SZ-001",
            IssueDate: DateOnly.FromDateTime(DateTime.UtcNow),
            Amount: 100_000m,
            IsPaid: false,
            PaymentDate: null,
            VendorContractId: null,
            BudgetItemId: null,
            Notes: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
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
            new Money(2_000_000m, "HUF"),
            null), byUserId);

        return app;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);
    }

    private void SetupInvoicesMock()
    {
        _contextMock.Setup(c => c.Invoices).Returns(CreateMockDbSet<Invoice>([]).Object);
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
