using FluentAssertions;
using GrantManagement.Application.Invoices.Commands.MarkInvoicePaid;

namespace GrantManagement.Application.Tests.Invoices;

public class MarkInvoicePaidCommandValidatorTests
{
    private readonly MarkInvoicePaidCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenPaymentDateIsDefault_ShouldFail()
    {
        var cmd = new MarkInvoicePaidCommand(
            ApplicationId: Guid.NewGuid(),
            InvoiceId: Guid.NewGuid(),
            PaymentDate: default);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.PaymentDate) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenPaymentDateIsSet_ShouldPass()
    {
        var cmd = new MarkInvoicePaidCommand(
            ApplicationId: Guid.NewGuid(),
            InvoiceId: Guid.NewGuid(),
            PaymentDate: DateOnly.FromDateTime(DateTime.UtcNow));

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
