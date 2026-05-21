using FluentAssertions;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Tests;

public class ApplicationTests
{
    private static Application CreateTestApplication()
    {
        var callData = new CallStepData
        {
            SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30),
            SpendingDeadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(365))
        };

        return Application.Create(
            title: "Test Pályázat",
            granterId: Guid.NewGuid(),
            callData: callData,
            createdByUserId: Guid.NewGuid(),
            identifier: "TEST-001");
    }

    [Fact]
    public void Create_ValidParams_CreatesApplicationWithDraftStatus()
    {
        var app = CreateTestApplication();

        app.Status.Should().Be(ApplicationStatus.Draft);
        app.Title.Should().Be("Test Pályázat");
        app.Identifier.Should().Be("TEST-001");
    }

    [Fact]
    public void Create_InitializesNineWorkflowSteps()
    {
        var app = CreateTestApplication();

        app.WorkflowSteps.Should().HaveCount(9);
        app.WorkflowSteps.Should().Contain(s => s.StepType == WorkflowStepType.Call);
        app.WorkflowSteps.Should().Contain(s => s.StepType == WorkflowStepType.Settlement);
    }

    [Fact]
    public void Create_EmptyTitle_ThrowsDomainException()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };

        var act = () => Application.Create("", Guid.NewGuid(), callData, Guid.NewGuid());

        act.Should().Throw<DomainException>()
            .WithMessage("*kötelező*");
    }

    [Fact]
    public void Create_RaisesApplicationCreatedDomainEvent()
    {
        var app = CreateTestApplication();

        app.DomainEvents.Should().ContainSingle(e =>
            e.GetType().Name == "ApplicationCreated");
    }

    [Fact]
    public void IsLocked_WhenClosedWon_ReturnsTrue()
    {
        var app = CreateTestApplication();

        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow,
            SubmittedByUserId = Guid.NewGuid()
        };
        app.RecordSubmission(submissionData, Guid.NewGuid());
        app.ApproveSubmission(Guid.NewGuid());

        var result = ApplicationResult.Won(
            DateOnly.FromDateTime(DateTime.UtcNow),
            Money.FromHuf(1_000_000));
        app.RecordResult(result, Guid.NewGuid());

        var settlement = new SettlementParams
        {
            SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        app.RecordSettlement(settlement, Guid.NewGuid());
        app.ApproveSettlement(Guid.NewGuid());

        app.IsLocked.Should().BeTrue();
        app.Status.Should().Be(ApplicationStatus.ClosedWon);
    }

    [Fact]
    public void UpdateCallData_WhenLocked_ThrowsDomainException()
    {
        var app = CreateTestApplication();
        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow,
            SubmittedByUserId = Guid.NewGuid()
        };
        app.RecordSubmission(submissionData, Guid.NewGuid());
        app.ApproveSubmission(Guid.NewGuid());
        app.RecordResult(
            ApplicationResult.Lost(DateOnly.FromDateTime(DateTime.UtcNow)),
            Guid.NewGuid());
        app.ManualClose();

        var newCallData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(60) };
        var act = () => app.UpdateCallData(newCallData);

        act.Should().Throw<DomainException>()
            .WithMessage("*Lezárt pályázat*");
    }

    [Fact]
    public void AddInvoice_AddsToInvoicesList()
    {
        var app = CreateTestApplication();
        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow,
            SubmittedByUserId = Guid.NewGuid()
        };
        app.RecordSubmission(submissionData, Guid.NewGuid());
        app.ApproveSubmission(Guid.NewGuid());
        app.RecordResult(
            ApplicationResult.Won(
                DateOnly.FromDateTime(DateTime.UtcNow),
                Money.FromHuf(2_000_000)),
            Guid.NewGuid());

        var invoice = app.AddInvoice(
            supplierName: "Acme Kft.",
            invoiceNumber: "INV-001",
            issueDate: DateOnly.FromDateTime(DateTime.UtcNow),
            amount: 100_000m,
            isPaid: false,
            paymentDate: null,
            byUserId: Guid.NewGuid());

        app.Invoices.Should().HaveCount(1);
        invoice.InvoiceNumber.Should().Be("INV-001");
        invoice.Amount.Should().Be(100_000m);
    }

    [Fact]
    public void RemoveVendorContract_WithLinkedInvoice_ThrowsDomainException()
    {
        var app = CreateTestApplication();
        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow,
            SubmittedByUserId = Guid.NewGuid()
        };
        app.RecordSubmission(submissionData, Guid.NewGuid());
        app.ApproveSubmission(Guid.NewGuid());
        app.RecordResult(
            ApplicationResult.Won(
                DateOnly.FromDateTime(DateTime.UtcNow),
                Money.FromHuf(5_000_000)),
            Guid.NewGuid());

        var vendorId = Guid.NewGuid();
        var contract = app.AddVendorContract(vendorId, Money.FromHuf(500_000), Guid.NewGuid());
        app.AddInvoice(
            supplierName: "Acme Kft.",
            invoiceNumber: "INV-001",
            issueDate: DateOnly.FromDateTime(DateTime.UtcNow),
            amount: 100_000m,
            isPaid: false,
            paymentDate: null,
            byUserId: Guid.NewGuid(),
            vendorContractId: contract.Id);

        var act = () => app.RemoveVendorContract(contract.Id);

        act.Should().Throw<DomainException>()
            .WithMessage("*számla*");
    }
}
