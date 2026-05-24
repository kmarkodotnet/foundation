using FluentAssertions;
using GrantManagement.Application.Applications.Commands.UpdateApplication;

namespace GrantManagement.Application.Tests.Applications;

public class UpdateApplicationCommandValidatorTests
{
    private readonly UpdateApplicationCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenTitleIsEmpty_ShouldFail()
    {
        var cmd = ValidCommand() with { Title = string.Empty };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.Title));
    }

    [Fact]
    public void Validate_WhenTitleExceedsMaxLength_ShouldFail()
    {
        var cmd = ValidCommand() with { Title = new string('B', 501) };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.Title));
    }

    [Fact]
    public void Validate_WhenAllValid_ShouldPass()
    {
        var result = _sut.Validate(ValidCommand());

        result.IsValid.Should().BeTrue();
    }

    private static UpdateApplicationCommand ValidCommand() => new(
        ApplicationId: Guid.NewGuid(),
        Title: "Frissített cím",
        Identifier: null,
        Description: null,
        SubmissionDeadline: DateTimeOffset.UtcNow.AddDays(30),
        MinAmount: null,
        MaxAmount: null,
        SpendingDeadline: null,
        ApplicationTypeId: null,
        OtherMetadata: null);
}
