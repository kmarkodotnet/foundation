using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.Commands.UpdateInvoice;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Invoices;

public class UpdateInvoiceCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly UpdateInvoiceCommandHandler _sut;

    public UpdateInvoiceCommandHandlerTests()
    {
        _sut = new UpdateInvoiceCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenInvoiceExists_ShouldUpdateAllFields()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var invoice = Invoice.Create(
            applicationId, "Original Kft.", "SZ-001",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            50_000m, false, null, Guid.NewGuid());

        SetupInvoicesMock([invoice]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var newIssueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-8));
        var paymentDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-3));
        var command = new UpdateInvoiceCommand(
            ApplicationId: applicationId,
            InvoiceId: invoice.Id,
            SupplierName: "Frissített Kft.",
            InvoiceNumber: "SZ-002",
            IssueDate: newIssueDate,
            Amount: 120_000m,
            IsPaid: true,
            PaymentDate: paymentDate,
            VendorContractId: null,
            BudgetItemId: null,
            Notes: "Új megjegyzés");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.SupplierName.Should().Be("Frissített Kft.");
        result.InvoiceNumber.Should().Be("SZ-002");
        result.Amount.Should().Be(120_000m);
        result.IsPaid.Should().BeTrue();
        result.PaymentDate.Should().Be(paymentDate);
        result.Notes.Should().Be("Új megjegyzés");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenInvoiceNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupInvoicesMock([]);

        var command = new UpdateInvoiceCommand(
            ApplicationId: Guid.NewGuid(),
            InvoiceId: Guid.NewGuid(),
            SupplierName: "Kft.",
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

    private void SetupInvoicesMock(List<Invoice> data)
    {
        _contextMock.Setup(c => c.Invoices).Returns(CreateMockDbSet(data).Object);
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
