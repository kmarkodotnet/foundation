using FluentAssertions;
using GrantManagement.Application.Granters.Commands.CreateGranter;

namespace GrantManagement.Application.Tests.Granters;

public class CreateGranterCommandValidatorTests
{
    private readonly CreateGranterCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenNameEmpty_ShouldFail()
    {
        var cmd = new CreateGranterCommand("", null, null, null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Name) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenNameTooLong_ShouldFail()
    {
        var cmd = new CreateGranterCommand(new string('x', 301), null, null, null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Name) &&
            e.ErrorMessage.Contains("300"));
    }

    [Fact]
    public void Validate_WhenEmailInvalid_ShouldFail()
    {
        var cmd = new CreateGranterCommand("Nemzeti Alap", null, null, "nem-email");

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Email) &&
            e.ErrorMessage.Contains("Érvénytelen"));
    }

    [Fact]
    public void Validate_WhenValid_ShouldPass()
    {
        var cmd = new CreateGranterCommand("Nemzeti Alap", "Leírás", "+36 1 234 5678", "info@national.hu");

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
