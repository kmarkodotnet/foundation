using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.Commands.MarkInvoicePaid;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Invoices;

public class MarkInvoicePaidCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly MarkInvoicePaidCommandHandler _sut;

    public MarkInvoicePaidCommandHandlerTests()
    {
        _sut = new MarkInvoicePaidCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenUnpaidInvoice_ShouldMarkPaidAndSetPaymentDate()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var invoice = CreateUnpaidInvoice(applicationId);
        SetupInvoicesMock([invoice]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var paymentDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var command = new MarkInvoicePaidCommand(applicationId, invoice.Id, paymentDate);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.IsPaid.Should().BeTrue();
        result.PaymentDate.Should().Be(paymentDate);
        invoice.IsPaid.Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenInvoiceAlreadyPaid_ShouldThrowDomainException()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var invoice = CreatePaidInvoice(applicationId);
        SetupInvoicesMock([invoice]);

        var command = new MarkInvoicePaidCommand(
            applicationId, invoice.Id, DateOnly.FromDateTime(DateTime.UtcNow));

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*már fizetve*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenInvoiceNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupInvoicesMock([]);

        var command = new MarkInvoicePaidCommand(
            Guid.NewGuid(), Guid.NewGuid(), DateOnly.FromDateTime(DateTime.UtcNow));

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static Invoice CreateUnpaidInvoice(Guid applicationId)
        => Invoice.Create(
            applicationId,
            "Acme Kft.",
            "SZ-001",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            100_000m,
            isPaid: false,
            paymentDate: null,
            createdByUserId: Guid.NewGuid());

    private static Invoice CreatePaidInvoice(Guid applicationId)
    {
        var invoice = Invoice.Create(
            applicationId,
            "Acme Kft.",
            "SZ-002",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            80_000m,
            isPaid: false,
            paymentDate: null,
            createdByUserId: Guid.NewGuid());

        invoice.MarkPaid(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)));
        return invoice;
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
