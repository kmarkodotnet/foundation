using FluentAssertions;
using GrantManagement.Application.VendorContracts.Commands.CreateVendorContract;

namespace GrantManagement.Application.Tests.VendorContracts;

public class CreateVendorContractCommandValidatorTests
{
    private readonly CreateVendorContractCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenVendorIdIsEmpty_ShouldFail()
    {
        var cmd = ValidCommand() with { VendorId = Guid.Empty };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.VendorId));
    }

    [Fact]
    public void Validate_WhenAmountIsZero_ShouldFail()
    {
        var cmd = ValidCommand() with { Amount = 0m };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.Amount));
    }

    [Fact]
    public void Validate_WhenAmountIsNegative_ShouldFail()
    {
        var cmd = ValidCommand() with { Amount = -1m };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_WhenCurrencyIsEmpty_ShouldFail()
    {
        var cmd = ValidCommand() with { Currency = "" };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.Currency));
    }

    [Fact]
    public void Validate_WhenAllFieldsValid_ShouldPass()
    {
        var cmd = ValidCommand();

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    private static CreateVendorContractCommand ValidCommand() => new(
        ApplicationId: Guid.NewGuid(),
        VendorId: Guid.NewGuid(),
        Amount: 250_000m,
        Currency: "HUF",
        ContractDate: DateOnly.FromDateTime(DateTime.UtcNow),
        ContractIdentifier: "ALVSZ-001",
        BudgetItemId: null,
        Notes: null);
}
