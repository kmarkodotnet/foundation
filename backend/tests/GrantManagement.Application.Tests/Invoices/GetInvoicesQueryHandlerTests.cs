using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.Queries.GetInvoices;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Invoices;

public class GetInvoicesQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly GetInvoicesQueryHandler _sut;

    public GetInvoicesQueryHandlerTests()
    {
        _sut = new GetInvoicesQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenInvoicesExist_ShouldReturnCorrectSummary()
    {
        // Arrange — 2 invoices: 250_000 paid, 150_000 unpaid; awarded = 1_000_000
        var application = CreateWonApplication(awardedAmount: 1_000_000m);
        var paid = CreateInvoice(application.Id, 250_000m, isPaid: true);
        var unpaid = CreateInvoice(application.Id, 150_000m, isPaid: false);

        SetupApplicationsMock([application]);
        SetupInvoicesMock([paid, unpaid]);

        // Act
        var result = await _sut.Handle(new GetInvoicesQuery(application.Id), CancellationToken.None);

        // Assert
        result.Summary.TotalInvoiced.Should().Be(400_000m);
        result.Summary.TotalPaid.Should().Be(250_000m);
        result.Summary.TotalUnpaid.Should().Be(150_000m);
        result.Summary.AwardedAmount.Should().Be(1_000_000m);
        result.Summary.Balance.Should().Be(600_000m);
        result.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_WhenFilteredByIsPaid_ShouldReturnOnlyMatchingInvoices()
    {
        // Arrange
        var application = CreateWonApplication(1_000_000m);
        var paid = CreateInvoice(application.Id, 200_000m, isPaid: true);
        var unpaid = CreateInvoice(application.Id, 100_000m, isPaid: false);

        SetupApplicationsMock([application]);
        SetupInvoicesMock([paid, unpaid]);

        // Act
        var result = await _sut.Handle(
            new GetInvoicesQuery(application.Id, IsPaid: true), CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items.Single().IsPaid.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenSortedByAmountDesc_ShouldReturnHighestFirst()
    {
        // Arrange
        var application = CreateWonApplication(1_000_000m);
        var small = CreateInvoice(application.Id, 50_000m, isPaid: false);
        var large = CreateInvoice(application.Id, 300_000m, isPaid: false);

        SetupApplicationsMock([application]);
        SetupInvoicesMock([small, large]);

        // Act
        var result = await _sut.Handle(
            new GetInvoicesQuery(application.Id, SortBy: "amount", SortDirection: "desc"),
            CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(2);
        result.Items[0].Amount.Should().Be(300_000m);
        result.Items[1].Amount.Should().Be(50_000m);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        // Act
        Func<Task> act = () =>
            _sut.Handle(new GetInvoicesQuery(Guid.NewGuid()), CancellationToken.None);

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
            new Money(awardedAmount, "HUF"),
            null), byUserId);

        return app;
    }

    private static Invoice CreateInvoice(Guid applicationId, decimal amount, bool isPaid)
    {
        var invoice = Invoice.Create(
            applicationId,
            "Acme Kft.",
            $"SZ-{Guid.NewGuid():N}",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            amount,
            isPaid: false,
            paymentDate: null,
            createdByUserId: Guid.NewGuid());

        if (isPaid)
            invoice.MarkPaid(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)));

        return invoice;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);
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
