using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Application.VendorContracts.Commands.DeleteVendorContract;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.VendorContracts;

public class DeleteVendorContractCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly DeleteVendorContractCommandHandler _sut;

    public DeleteVendorContractCommandHandlerTests()
    {
        _sut = new DeleteVendorContractCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenNoLinkedInvoices_ShouldRemoveContract()
    {
        // Arrange
        var (application, contractId) = CreateWonApplicationWithVendorContract();
        SetupApplicationsMock([application]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new DeleteVendorContractCommand(application.Id, contractId);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        application.VendorContracts.Should().BeEmpty();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenLinkedInvoiceExists_ShouldThrowDomainException()
    {
        // Arrange
        var (application, contractId) = CreateWonApplicationWithVendorContractAndInvoice();
        SetupApplicationsMock([application]);

        var command = new DeleteVendorContractCommand(application.Id, contractId);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*számla*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new DeleteVendorContractCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static (GrantApp app, Guid contractId) CreateWonApplicationWithVendorContract()
    {
        var byUserId = Guid.NewGuid();
        var app = CreateWonApplication(byUserId);

        var contract = app.AddVendorContract(
            vendorId: Guid.NewGuid(),
            amount: new Money(250_000m, "HUF"),
            byUserId: byUserId,
            contractIdentifier: "ALVSZ-001");

        return (app, contract.Id);
    }

    private static (GrantApp app, Guid contractId) CreateWonApplicationWithVendorContractAndInvoice()
    {
        var byUserId = Guid.NewGuid();
        var app = CreateWonApplication(byUserId);

        var contract = app.AddVendorContract(
            vendorId: Guid.NewGuid(),
            amount: new Money(250_000m, "HUF"),
            byUserId: byUserId);

        app.AddInvoice(
            supplierName: "Acme Kft.",
            invoiceNumber: "SZ-001",
            issueDate: DateOnly.FromDateTime(DateTime.UtcNow),
            amount: 100_000m,
            isPaid: false,
            paymentDate: null,
            byUserId: byUserId,
            vendorContractId: contract.Id);

        return (app, contract.Id);
    }

    private static GrantApp CreateWonApplication(Guid byUserId)
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
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
