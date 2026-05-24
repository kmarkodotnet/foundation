using FluentAssertions;
using GrantManagement.Application.Applications.Commands.CreateApplication;

namespace GrantManagement.Application.Tests.Applications;

public class CreateApplicationCommandValidatorTests
{
    private readonly CreateApplicationCommandValidator _sut = new();

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
        var cmd = ValidCommand() with { Title = new string('A', 501) };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.Title));
    }

    [Fact]
    public void Validate_WhenGranterIdIsEmpty_ShouldFail()
    {
        var cmd = ValidCommand() with { GranterId = Guid.Empty };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.GranterId));
    }

    [Fact]
    public void Validate_WhenSubmissionDeadlineIsInPast_ShouldFail()
    {
        var cmd = ValidCommand() with { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(-1) };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.SubmissionDeadline));
    }

    [Fact]
    public void Validate_WhenAllRequiredFieldsValid_ShouldPass()
    {
        var cmd = ValidCommand();

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    private static CreateApplicationCommand ValidCommand() => new(
        Title: "Oktatási pályázat 2025",
        GranterId: Guid.NewGuid(),
        SubmissionDeadline: DateTimeOffset.UtcNow.AddDays(30));
}
