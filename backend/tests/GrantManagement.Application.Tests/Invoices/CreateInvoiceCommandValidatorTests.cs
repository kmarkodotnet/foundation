using FluentAssertions;
using GrantManagement.Application.Invoices.Commands.CreateInvoice;

namespace GrantManagement.Application.Tests.Invoices;

public class CreateInvoiceCommandValidatorTests
{
    private readonly CreateInvoiceCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenIsPaidAndNoPaymentDate_ShouldFail()
    {
        var cmd = ValidCommand() with { IsPaid = true, PaymentDate = null };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.PaymentDate) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenAmountIsZero_ShouldFail()
    {
        var cmd = ValidCommand() with { Amount = 0m };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Amount) &&
            e.ErrorMessage.Contains("pozitív"));
    }

    [Fact]
    public void Validate_WhenSupplierNameIsEmpty_ShouldFail()
    {
        var cmd = ValidCommand() with { SupplierName = "" };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.SupplierName));
    }

    [Fact]
    public void Validate_WhenInvoiceNumberIsEmpty_ShouldFail()
    {
        var cmd = ValidCommand() with { InvoiceNumber = "" };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.InvoiceNumber));
    }

    [Fact]
    public void Validate_WhenIsPaidWithPaymentDate_ShouldPass()
    {
        var cmd = ValidCommand() with
        {
            IsPaid = true,
            PaymentDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenNotPaidAndNoPaymentDate_ShouldPass()
    {
        var cmd = ValidCommand() with { IsPaid = false, PaymentDate = null };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    private static CreateInvoiceCommand ValidCommand() => new(
        ApplicationId: Guid.NewGuid(),
        SupplierName: "Acme Kft.",
        InvoiceNumber: "SZ-2025-001",
        IssueDate: DateOnly.FromDateTime(DateTime.UtcNow),
        Amount: 125_000m,
        IsPaid: false,
        PaymentDate: null,
        VendorContractId: null,
        BudgetItemId: null,
        Notes: null);
}
