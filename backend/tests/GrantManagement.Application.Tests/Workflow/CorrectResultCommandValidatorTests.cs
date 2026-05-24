using FluentAssertions;
using GrantManagement.Application.Workflow.Commands.CorrectResult;

namespace GrantManagement.Application.Tests.Workflow;

public class CorrectResultCommandValidatorTests
{
    private readonly CorrectResultCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenIsWonAndZeroAmount_ShouldFail()
    {
        var cmd = new CorrectResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: true,
            AwardedAmount: 0m,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.AwardedAmount) &&
            e.ErrorMessage.Contains("pozitív"));
    }

    [Fact]
    public void Validate_WhenIsWonAndNoResultDate_ShouldFail()
    {
        var cmd = new CorrectResultCommand(
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
        var cmd = new CorrectResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: true,
            AwardedAmount: 750_000m,
            ResultDate: DateOnly.FromDateTime(DateTime.UtcNow),
            ResultIdentifier: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenIsLostAndAmountProvided_ShouldFail()
    {
        var cmd = new CorrectResultCommand(
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
        var cmd = new CorrectResultCommand(
            ApplicationId: Guid.NewGuid(),
            IsWon: false,
            AwardedAmount: null,
            ResultDate: null,
            ResultIdentifier: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
