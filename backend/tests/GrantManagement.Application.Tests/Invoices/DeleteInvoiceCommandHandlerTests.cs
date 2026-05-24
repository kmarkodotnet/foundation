using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.Commands.DeleteInvoice;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Invoices;

public class DeleteInvoiceCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly DeleteInvoiceCommandHandler _sut;

    public DeleteInvoiceCommandHandlerTests()
    {
        _sut = new DeleteInvoiceCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenInvoiceExists_ShouldSoftDelete()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var invoice = Invoice.Create(
            applicationId, "Acme Kft.", "SZ-001",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            100_000m, false, null, Guid.NewGuid());

        SetupInvoicesMock([invoice]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new DeleteInvoiceCommand(applicationId, invoice.Id);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        invoice.IsDeleted.Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenInvoiceNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupInvoicesMock([]);

        var command = new DeleteInvoiceCommand(Guid.NewGuid(), Guid.NewGuid());

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
