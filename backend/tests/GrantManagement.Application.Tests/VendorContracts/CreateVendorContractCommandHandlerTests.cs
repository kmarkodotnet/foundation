using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Application.VendorContracts.Commands.CreateVendorContract;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.VendorContracts;

public class CreateVendorContractCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly CreateVendorContractCommandHandler _sut;

    public CreateVendorContractCommandHandlerTests()
    {
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        _sut = new CreateVendorContractCommandHandler(_contextMock.Object, _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenWonApplicationAndValidVendor_ShouldCreateContract()
    {
        // Arrange
        var vendor = Vendor.Create("Teszt Kft.", null, null, ContactInfo.Empty);
        var application = CreateWonApplication();
        SetupApplicationsMock([application]);
        SetupVendorsMock([vendor]);
        SetupVendorContractsMock();
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CreateVendorContractCommand(
            ApplicationId: application.Id,
            VendorId: vendor.Id,
            Amount: 250_000m,
            Currency: "HUF",
            ContractDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ContractIdentifier: "ALVSZ-001",
            BudgetItemId: null,
            Notes: null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.VendorName.Should().Be("Teszt Kft.");
        result.Amount.Should().Be(250_000m);
        result.Currency.Should().Be("HUF");
        result.ContractIdentifier.Should().Be("ALVSZ-001");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotWon_ShouldThrowDomainException()
    {
        // Arrange — Draft application
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var draftApp = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
        SetupApplicationsMock([draftApp]);

        var command = new CreateVendorContractCommand(
            ApplicationId: draftApp.Id,
            VendorId: Guid.NewGuid(),
            Amount: 100_000m,
            Currency: "HUF",
            ContractDate: null,
            ContractIdentifier: null,
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

        var command = new CreateVendorContractCommand(
            ApplicationId: Guid.NewGuid(),
            VendorId: Guid.NewGuid(),
            Amount: 100_000m,
            Currency: "HUF",
            ContractDate: null,
            ContractIdentifier: null,
            BudgetItemId: null,
            Notes: null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenVendorNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var application = CreateWonApplication();
        SetupApplicationsMock([application]);
        SetupVendorsMock([]); // no vendors

        var command = new CreateVendorContractCommand(
            ApplicationId: application.Id,
            VendorId: Guid.NewGuid(),
            Amount: 100_000m,
            Currency: "HUF",
            ContractDate: null,
            ContractIdentifier: null,
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

    private void SetupVendorsMock(List<Vendor> data)
    {
        _contextMock.Setup(c => c.Vendors).Returns(CreateMockDbSet(data).Object);
    }

    private void SetupVendorContractsMock()
    {
        _contextMock.Setup(c => c.VendorContracts)
            .Returns(CreateMockDbSet<VendorContract>([]).Object);
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
