using FluentAssertions;
using GrantManagement.Application.Workflow.Commands.RecordResult;

namespace GrantManagement.Application.Tests.Workflow;

public class RecordResultCommandValidatorTests
{
    private readonly RecordResultCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenIsWonAndZeroAmount_ShouldFail()
    {
        var cmd = new RecordResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: true,
            AwardedAmount: 0,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_WhenIsWonAndNoResultDate_ShouldFail()
    {
        var cmd = new RecordResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: true,
            AwardedAmount: 500_000m,
            ResultDate: null,
            ResultIdentifier: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.ResultDate) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenIsWonAndValidData_ShouldPass()
    {
        var cmd = new RecordResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: true,
            AwardedAmount: 1_000_000m,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: "REF-2024");

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenIsLostAndAmountProvided_ShouldFail()
    {
        var cmd = new RecordResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: false,
            AwardedAmount: 100_000m,
            ResultDate: null,
            ResultIdentifier: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.AwardedAmount) &&
            e.ErrorMessage.Contains("összeg nem adható meg"));
    }

    [Fact]
    public void Validate_WhenIsLostAndNoAmount_ShouldPass()
    {
        var cmd = new RecordResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: false,
            AwardedAmount: null,
            ResultDate: null,
            ResultIdentifier: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
